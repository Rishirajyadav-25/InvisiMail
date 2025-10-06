// src/app/api/domains/route.js - COMPLETE FIX
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import { ObjectId } from 'mongodb';
import dns from 'dns/promises';
import { mg } from '../../../lib/mailgun';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const client = await clientPromise;
    const db = client.db();

    const domains = await db.collection('custom_domains').find({
      userId: new ObjectId(decoded.userId)
    }).sort({ createdAt: -1 }).toArray();

    // Auto-verify unverified domains
    for (const domain of domains) {
      if (!domain.isVerified) {
        verifyDomainInBackground(db, domain).catch(err => 
          console.error(`Background verification failed for ${domain.domain}:`, err)
        );
      }
    }

    return NextResponse.json(domains);

  } catch (error) {
    console.error('Get domains error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function verifyDomainInBackground(db, domain) {
  try {
    console.log(`[Auto-Verify] Checking ${domain.domain}...`);
    
    const txtRecords = await dns.resolveTxt(`_mailalias-verification.${domain.domain}`);
    const flatRecords = txtRecords.flat();
    const isVerified = flatRecords.includes(domain.verificationToken);

    if (isVerified) {
      console.log(`[Auto-Verify] ✅ ${domain.domain} verified!`);
      
      let mailgunStatus = 'not_added';
      let mailgunDnsRecords = null;
      
      try {
        // First check if domain already exists
        try {
          const existingDomain = await mg.domains.get(domain.domain);
          console.log('[Mailgun] Domain already exists:', existingDomain);
          mailgunStatus = 'added';
          
          // Fetch DNS records
          mailgunDnsRecords = {
            sending_dns_records: existingDomain.sending_dns_records || [],
            receiving_dns_records: existingDomain.receiving_dns_records || []
          };
          
        } catch (getError) {
          if (getError.status === 404) {
            // Domain doesn't exist, create it
            console.log('[Mailgun] Creating new domain...');
            
            const newDomain = await mg.domains.create({
              name: domain.domain,
              smtp_password: `mailgun-${Math.random().toString(36).substring(2, 15)}`,
              spam_action: 'disabled',
              wildcard: false,
              force_dkim_authority: false,
              dkim_key_size: 1024
            });
            
            console.log('[Mailgun] Domain created successfully');
            mailgunStatus = 'added';
            
            // Fetch DNS records for new domain
            const domainDetails = await mg.domains.get(domain.domain);
            mailgunDnsRecords = {
              sending_dns_records: domainDetails.sending_dns_records || [],
              receiving_dns_records: domainDetails.receiving_dns_records || []
            };
          } else {
            throw getError;
          }
        }
        
      } catch (mailgunError) {
        console.error('[Mailgun] Error:', mailgunError);
        mailgunStatus = 'failed';
      }

      await db.collection('custom_domains').updateOne(
        { _id: domain._id },
        {
          $set: {
            isVerified: true,
            status: 'verified',
            verifiedAt: new Date(),
            updatedAt: new Date(),
            mailgunStatus,
            mailgunDnsRecords,
            lastVerificationAttempt: new Date()
          }
        }
      );
      
      return true;
    } else {
      await db.collection('custom_domains').updateOne(
        { _id: domain._id },
        { $set: { lastVerificationAttempt: new Date(), updatedAt: new Date() } }
      );
      return false;
    }
  } catch (dnsError) {
    console.log(`[Auto-Verify] DNS not ready for ${domain.domain}:`, dnsError.code);
    await db.collection('custom_domains').updateOne(
      { _id: domain._id },
      { $set: { lastVerificationAttempt: new Date(), updatedAt: new Date() } }
    );
    return false;
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    if (user?.plan !== 'pro') {
      return NextResponse.json({ error: 'Custom domains are a Pro feature' }, { status: 403 });
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    if (!domainRegex.test(domain.trim().toLowerCase())) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    const cleanDomain = domain.trim().toLowerCase();

    const existingDomain = await db.collection('custom_domains').findOne({
      domain: cleanDomain
    });

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
    }

    const verificationToken = `mailalias-verify-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const newDomain = {
      userId: new ObjectId(decoded.userId),
      domain: cleanDomain,
      isVerified: false,
      verificationToken,
      verificationMethod: 'txt',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastVerificationAttempt: null,
      mailgunStatus: 'not_added',
      mailgunDnsRecords: null,
      dkimVerified: false,
      spfVerified: false,
      mxVerified: false
    };

    const result = await db.collection('custom_domains').insertOne(newDomain);

    return NextResponse.json({
      message: 'Domain added successfully. Please verify ownership.',
      domain: {
        ...newDomain,
        _id: result.insertedId
      },
      verificationInstructions: {
        type: 'TXT',
        name: `_mailalias-verification.${cleanDomain}`,
        value: verificationToken,
        ttl: 3600
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Add domain error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { domainId, action } = await request.json();

    if (!domainId || !ObjectId.isValid(domainId)) {
      return NextResponse.json({ error: 'Valid domain ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const domain = await db.collection('custom_domains').findOne({
      _id: new ObjectId(domainId),
      userId: new ObjectId(decoded.userId)
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (action === 'check_mailgun_status') {
      try {
        const mgDomain = await mg.domains.get(domain.domain);
        
        const updateData = {
          updatedAt: new Date(),
          mailgunStatus: mgDomain.state === 'active' ? 'active' : 'added',
          dkimVerified: mgDomain.dkim_key_valid === true,
          spfVerified: mgDomain.spf_valid === true,
          mxVerified: mgDomain.mx_valid === true,
          mailgunDnsRecords: {
            sending_dns_records: mgDomain.sending_dns_records || [],
            receiving_dns_records: mgDomain.receiving_dns_records || []
          }
        };

        await db.collection('custom_domains').updateOne(
          { _id: new ObjectId(domainId) },
          { $set: updateData }
        );

        return NextResponse.json({
          message: 'Mailgun status updated successfully',
          mailgunStatus: updateData.mailgunStatus,
          dkimVerified: updateData.dkimVerified,
          spfVerified: updateData.spfVerified,
          mxVerified: updateData.mxVerified,
          dnsRecords: updateData.mailgunDnsRecords
        });

      } catch (mailgunError) {
        console.error('Mailgun status check error:', mailgunError);
        
        // If domain not found in Mailgun, try to create it
        if (mailgunError.status === 404) {
          try {
            console.log('[Retry] Creating domain in Mailgun...');
            await mg.domains.create({
              name: domain.domain,
              smtp_password: `mailgun-${Math.random().toString(36).substring(2, 15)}`,
              spam_action: 'disabled',
              wildcard: false,
              force_dkim_authority: false,
              dkim_key_size: 1024
            });
            
            // Fetch the newly created domain
            const newDomain = await mg.domains.get(domain.domain);
            
            await db.collection('custom_domains').updateOne(
              { _id: new ObjectId(domainId) },
              {
                $set: {
                  mailgunStatus: 'added',
                  updatedAt: new Date(),
                  mailgunDnsRecords: {
                    sending_dns_records: newDomain.sending_dns_records || [],
                    receiving_dns_records: newDomain.receiving_dns_records || []
                  }
                }
              }
            );
            
            return NextResponse.json({
              message: 'Domain added to Mailgun successfully',
              mailgunStatus: 'added',
              dnsRecords: {
                sending_dns_records: newDomain.sending_dns_records || [],
                receiving_dns_records: newDomain.receiving_dns_records || []
              }
            });
            
          } catch (createError) {
            console.error('[Retry] Failed to create domain:', createError);
            return NextResponse.json({
              error: 'Failed to add domain to Mailgun. Please check your Mailgun API key.',
              details: createError.message
            }, { status: 500 });
          }
        }
        
        return NextResponse.json({
          error: 'Failed to check Mailgun status',
          details: mailgunError.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Update domain error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('id');

    if (!domainId || !ObjectId.isValid(domainId)) {
      return NextResponse.json({ error: 'Valid domain ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const domain = await db.collection('custom_domains').findOne({
      _id: new ObjectId(domainId),
      userId: new ObjectId(decoded.userId)
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const aliasesUsingDomain = await db.collection('aliases').countDocuments({
      userId: new ObjectId(decoded.userId),
      aliasEmail: { $regex: `@${domain.domain}$` }
    });

    if (aliasesUsingDomain > 0) {
      return NextResponse.json({
        error: `Cannot delete domain. ${aliasesUsingDomain} aliases are using this domain.`
      }, { status: 400 });
    }

    if (domain.mailgunStatus === 'added' || domain.mailgunStatus === 'active') {
      try {
        await mg.domains.destroy(domain.domain);
      } catch (mailgunError) {
        console.warn('Failed to remove domain from Mailgun:', mailgunError.message);
      }
    }

    await db.collection('custom_domains').deleteOne({
      _id: new ObjectId(domainId),
      userId: new ObjectId(decoded.userId)
    });

    return NextResponse.json({ message: 'Domain deleted successfully' });

  } catch (error) {
    console.error('Delete domain error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


















// // src/app/api/domains/route.js
// import { NextResponse } from 'next/server';
// import clientPromise from '../../../lib/mongodb';
// import { verifyToken } from '../../../lib/auth';
// import { ObjectId } from 'mongodb';
// import dns from 'dns/promises';
// import { mg } from '../../../lib/mailgun';

// export async function GET(request) {
//   try {
//     const token = request.cookies.get('token')?.value;
    
//     if (!token) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }

//     const decoded = verifyToken(token);
//     const client = await clientPromise;
//     const db = client.db();

//     // Fetch user's domains
//     const domains = await db.collection('custom_domains').find({
//       userId: new ObjectId(decoded.userId)
//     }).sort({ createdAt: -1 }).toArray();

//     return NextResponse.json(domains);

//   } catch (error) {
//     console.error('Get domains error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// export async function POST(request) {
//   try {
//     const token = request.cookies.get('token')?.value;
    
//     if (!token) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }

//     const decoded = verifyToken(token);
//     const { domain } = await request.json();

//     if (!domain) {
//       return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db();

//     // Check if user is Pro
//     const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
//     if (user?.plan !== 'pro') {
//       return NextResponse.json({ error: 'Custom domains are a Pro feature' }, { status: 403 });
//     }

//     // Validate domain format
//     const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
//     if (!domainRegex.test(domain.trim().toLowerCase())) {
//       return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
//     }

//     const cleanDomain = domain.trim().toLowerCase();

//     // Check if domain already exists
//     const existingDomain = await db.collection('custom_domains').findOne({
//       domain: cleanDomain
//     });

//     if (existingDomain) {
//       return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
//     }

//     // Generate verification token
//     const verificationToken = `mailalias-verify-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

//     // Create domain record
//     const newDomain = {
//       userId: new ObjectId(decoded.userId),
//       domain: cleanDomain,
//       isVerified: false,
//       verificationToken,
//       verificationMethod: 'txt',
//       status: 'pending',
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       lastVerificationAttempt: null,
//       mailgunStatus: 'not_added',
//       dkimVerified: false,
//       spfVerified: false,
//       mxVerified: false
//     };

//     const result = await db.collection('custom_domains').insertOne(newDomain);

//     return NextResponse.json({
//       message: 'Domain added successfully. Please verify ownership.',
//       domain: {
//         ...newDomain,
//         _id: result.insertedId
//       },
//       verificationInstructions: {
//         type: 'TXT',
//         name: `_mailalias-verification.${cleanDomain}`,
//         value: verificationToken,
//         ttl: 3600
//       }
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Add domain error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// export async function PATCH(request) {
//   try {
//     const token = request.cookies.get('token')?.value;
    
//     if (!token) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }

//     const decoded = verifyToken(token);
//     const { domainId, action } = await request.json();

//     if (!domainId || !ObjectId.isValid(domainId)) {
//       return NextResponse.json({ error: 'Valid domain ID is required' }, { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db();

//     // Fetch domain and verify ownership
//     const domain = await db.collection('custom_domains').findOne({
//       _id: new ObjectId(domainId),
//       userId: new ObjectId(decoded.userId)
//     });

//     if (!domain) {
//       return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
//     }

//     if (action === 'verify') {
//       try {
//         // Verify DNS TXT record
//         const txtRecords = await dns.resolveTxt(`_mailalias-verification.${domain.domain}`);
//         const flatRecords = txtRecords.flat();
//         const isVerified = flatRecords.includes(domain.verificationToken);

//         if (isVerified) {
//           // Add domain to Mailgun if not already added
//           let mailgunStatus = domain.mailgunStatus;
//           if (mailgunStatus === 'not_added') {
//             try {
//               await mg.domains.create({
//                 name: domain.domain,
//                 smtp_password: `mailgun-${Math.random().toString(36).substring(2, 15)}`,
//                 spam_action: 'disabled',
//                 wildcard: false,
//                 force_dkim_authority: false
//               });
//               mailgunStatus = 'added';
//             } catch (mailgunError) {
//               console.error('Mailgun domain creation error:', mailgunError);
//               mailgunStatus = 'failed';
//             }
//           }

//           // Update domain as verified
//           await db.collection('custom_domains').updateOne(
//             { _id: new ObjectId(domainId) },
//             {
//               $set: {
//                 isVerified: true,
//                 status: 'verified',
//                 verifiedAt: new Date(),
//                 updatedAt: new Date(),
//                 lastVerificationAttempt: new Date(),
//                 mailgunStatus
//               }
//             }
//           );

//           return NextResponse.json({
//             message: 'Domain verified successfully!',
//             isVerified: true,
//             mailgunStatus
//           });
//         } else {
//           await db.collection('custom_domains').updateOne(
//             { _id: new ObjectId(domainId) },
//             {
//               $set: {
//                 lastVerificationAttempt: new Date(),
//                 updatedAt: new Date()
//               }
//             }
//           );

//           return NextResponse.json({
//             error: 'Verification failed. Please ensure the TXT record is properly configured.',
//             expectedRecord: {
//               type: 'TXT',
//               name: `_mailalias-verification.${domain.domain}`,
//               value: domain.verificationToken
//             }
//           }, { status: 400 });
//         }
//       } catch (dnsError) {
//         console.error('DNS verification error:', dnsError);
        
//         await db.collection('custom_domains').updateOne(
//           { _id: new ObjectId(domainId) },
//           {
//             $set: {
//               lastVerificationAttempt: new Date(),
//               updatedAt: new Date()
//             }
//           }
//         );

//         return NextResponse.json({
//           error: 'DNS verification failed. Please check if the TXT record is properly configured and try again.',
//           dnsError: dnsError.message
//         }, { status: 400 });
//       }
//     } else if (action === 'check_mailgun_status') {
//       try {
//         const mgDomain = await mg.domains.get(domain.domain);
        
//         // Update domain status based on Mailgun response
//         const updateData = {
//           updatedAt: new Date(),
//           mailgunStatus: mgDomain.state === 'active' ? 'active' : 'pending',
//           dkimVerified: mgDomain.dkim_key_valid === true,
//           spfVerified: mgDomain.spf_valid === true,
//           mxVerified: mgDomain.mx_valid === true
//         };

//         await db.collection('custom_domains').updateOne(
//           { _id: new ObjectId(domainId) },
//           { $set: updateData }
//         );

//         return NextResponse.json({
//           message: 'Mailgun status updated',
//           mailgunStatus: updateData.mailgunStatus,
//           dkimVerified: updateData.dkimVerified,
//           spfVerified: updateData.spfVerified,
//           mxVerified: updateData.mxVerified
//         });

//       } catch (mailgunError) {
//         console.error('Mailgun status check error:', mailgunError);
//         return NextResponse.json({
//           error: 'Failed to check Mailgun status',
//           details: mailgunError.message
//         }, { status: 500 });
//       }
//     }

//     return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

//   } catch (error) {
//     console.error('Update domain error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// export async function DELETE(request) {
//   try {
//     const token = request.cookies.get('token')?.value;
    
//     if (!token) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }

//     const decoded = verifyToken(token);
//     const { searchParams } = new URL(request.url);
//     const domainId = searchParams.get('id');

//     if (!domainId || !ObjectId.isValid(domainId)) {
//       return NextResponse.json({ error: 'Valid domain ID is required' }, { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db();

//     // Check if domain exists and user owns it
//     const domain = await db.collection('custom_domains').findOne({
//       _id: new ObjectId(domainId),
//       userId: new ObjectId(decoded.userId)
//     });

//     if (!domain) {
//       return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
//     }

//     // Check if domain is being used by any aliases
//     const aliasesUsingDomain = await db.collection('aliases').countDocuments({
//       userId: new ObjectId(decoded.userId),
//       aliasEmail: { $regex: `@${domain.domain}$` }
//     });

//     if (aliasesUsingDomain > 0) {
//       return NextResponse.json({
//         error: `Cannot delete domain. ${aliasesUsingDomain} aliases are using this domain.`
//       }, { status: 400 });
//     }

//     // Remove from Mailgun if it was added
//     if (domain.mailgunStatus === 'added' || domain.mailgunStatus === 'active') {
//       try {
//         await mg.domains.destroy(domain.domain);
//       } catch (mailgunError) {
//         console.warn('Failed to remove domain from Mailgun:', mailgunError.message);
//       }
//     }

//     // Delete domain
//     await db.collection('custom_domains').deleteOne({
//       _id: new ObjectId(domainId),
//       userId: new ObjectId(decoded.userId)
//     });

//     return NextResponse.json({ message: 'Domain deleted successfully' });

//   } catch (error) {
//     console.error('Delete domain error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }
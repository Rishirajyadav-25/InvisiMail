// src/components/Footer.jsx

export default function Footer() {
  return (
    <footer className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <a className="bg-white rounded-xl border shadow-md p-3 text-center text-sm text-gray-600 hover:text-gray-800" href="#">Documentation</a>
      <a className="bg-white rounded-xl border shadow-md p-3 text-center text-sm text-gray-600 hover:text-gray-800" href="#">Support</a>
      <a className="bg-white rounded-xl border shadow-md p-3 text-center text-sm text-gray-600 hover:text-gray-800" href="#">Privacy Policy</a>
    </footer>
  );
}
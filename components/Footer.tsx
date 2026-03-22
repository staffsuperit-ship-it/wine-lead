export default function Footer() {
  return (
    <footer className="bg-gray-100 p-6 mt-10 border-t border-gray-200 w-full">
      <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-4">
        <img 
          src="https://www.winelink.info/wp-content/uploads/2026/02/logo-orizzontale_wine_link.png" 
          alt="Wine Link Logo" 
          style={{ height: '50px', objectFit: 'contain' }}
        />
        <div className="text-gray-600 text-sm">
          <p className="font-bold text-slate-800 text-lg">Wine Link</p>
          <div className="flex flex-col gap-2 my-3">
            <a 
              href="https://wa.me/393934533500" 
              className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full font-medium shadow-sm hover:bg-green-600 transition-colors"
            >
              📱 WhatsApp: +39 393 453 3500
            </a>
            <a 
              href="https://www.winelink.info/" 
              target="_blank" 
              className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-4"
            >
              www.winelink.info
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
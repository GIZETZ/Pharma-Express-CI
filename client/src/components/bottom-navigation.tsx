import { useLocation } from "wouter";

interface BottomNavigationProps {
  currentPage: 'home' | 'pharmacies' | 'orders' | 'profile' | 'delivery';
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const navigationItems = [
    {
      key: 'home',
      label: 'Accueil',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
      path: '/home'
    },
    {
      key: 'pharmacies',
      label: 'Pharmacies',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h1a1 1 0 011 1v.01h10V4a1 1 0 011-1h1a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 2v11h8V6H6z" />
          <path fillRule="evenodd" d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      path: '/pharmacies'
    },
    {
      key: 'orders',
      label: 'Commandes',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h4a2 2 0 002-2V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      ),
      path: '/delivery'
    },
    {
      key: 'profile',
      label: 'Profil',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ),
      path: '/profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex items-center justify-around">
        {navigationItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center py-2 px-3 ${
              currentPage === item.key ? 'text-pharma-green' : 'text-gray-400 hover:text-pharma-green'
            } transition-colors`}
            data-testid={`nav-${item.key}`}
          >
            {item.icon}
            <span className="text-xs font-medium mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

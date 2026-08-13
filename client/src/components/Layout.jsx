import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';

const Layout = () => {
  const location = useLocation();

  // Pages where we hide the main Navbar and Footer (auth pages use their own layout)
  const authPaths = ['/login', '/register', '/verify-email', '/forgot-password'];
  const isAuthPage = authPaths.some(p => location.pathname.startsWith(p))
    || location.pathname.startsWith('/reset-password');

  // Pages with their own full-viewport layout that shouldn't show the footer
  const isFullLayoutPage = location.pathname.startsWith('/sell');

  return (
    <div className="app-layout">
      {!isAuthPage && <Navbar />}

      <main className={isAuthPage ? 'main-auth' : 'main-content'}>
        <Outlet />
      </main>

      {!isAuthPage && !isFullLayoutPage && <Footer />}
      {!isAuthPage && <MobileNav />}
    </div>
  );
};

export default Layout;

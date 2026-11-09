import { Link } from 'react-router';
import { IoLocationSharp } from 'react-icons/io5';
import { useAuth } from '@/contexts';
import { menuList } from '@/utils';

const NavBar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className='navbar bg-base-300 sticky top-0 z-50'>
      <div className='navbar-start'>
        <label htmlFor='main-drawer' className='btn btn-square btn-ghost lg:hidden'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            className='inline-block h-6 w-6 stroke-current'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M4 6h16M4 12h16M4 18h16'
            ></path>
          </svg>
        </label>
        <Link to='/' className='flex items-center text-3xl'>
          <IoLocationSharp />
          Venued
        </Link>
      </div>
      <div className='navbar-end hidden lg:flex'>
        <ul className='menu menu-horizontal px-1 gap-2 items-center'>
          {menuList
            .filter(
              (item) =>
                item.visibility === 'public' ||
                (item.visibility === 'private' && isAuthenticated) ||
                (item.visibility === 'noauth' && !isAuthenticated)
            )
            .map((item) => (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={item.cta ? `btn ${item.ctaType} rounded-2xl text-lg` : ''}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          {isAuthenticated && (
            <li onClick={logout}>
              <span>Log out</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default NavBar;

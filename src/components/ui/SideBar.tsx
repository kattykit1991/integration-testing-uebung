import type { RefObject } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts';
import { menuList } from '@/utils';

const SideBar = ({ drawerRef }: { drawerRef: RefObject<HTMLInputElement | null> }) => {
  const { isAuthenticated, logout } = useAuth();

  const closeSidebar = () => {
    if (drawerRef.current) {
      drawerRef.current.checked = false;
    }
  };

  return (
    <div className='drawer-side'>
      <label htmlFor='main-drawer' aria-label='close sidebar' className='drawer-overlay'></label>
      <ul className='menu bg-base-200 text-base-content min-h-full w-80 p-4'>
        <li className='mb-2'>
          <h2 className='menu-title'>Navigation</h2>
        </li>
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
                className={item.cta ? `w-1/2 btn ${item.ctaType} rounded-xl` : ''}
                onClick={closeSidebar}
              >
                {item.label}
              </Link>
            </li>
          ))}
        {isAuthenticated && (
          <li
            onClick={() => {
              logout();
              closeSidebar();
            }}
          >
            <span>Log out</span>
          </li>
        )}
      </ul>
    </div>
  );
};
export default SideBar;

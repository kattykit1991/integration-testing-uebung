import { useRef } from 'react';
import { Outlet } from 'react-router';
import { NavBar, SideBar, Footer } from '@/components';

const MainLayout = () => {
  const drawerRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className='drawer bg-base-200'>
      <input id='main-drawer' type='checkbox' className='drawer-toggle' ref={drawerRef} />
      <div className='drawer-content'>
        <NavBar />
        <div className='min-h-[calc(100vh-64px-68px)] relative'>
          <Outlet />
        </div>
        <Footer />
      </div>
      <SideBar drawerRef={drawerRef} />
    </div>
  );
};

export default MainLayout;

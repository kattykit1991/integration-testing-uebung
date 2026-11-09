import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router';
import { MainLayout, ProtectedLayout } from '@/layouts';
import { Events, Home, NotFound, Login, Register, CreateEvent } from '@/pages';
import { ErrorBoundary, Loading } from '@/components';
import { getAllEvents, getHomePageData } from '@/data';
import { createEventAction, loginAction, registerAction } from '@/actions';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path='/'
        element={<MainLayout />}
        hydrateFallbackElement={<Loading />}
        errorElement={<ErrorBoundary />}
      >
        <Route index element={<Home />} loader={getHomePageData} />
        <Route path='/login' element={<Login />} action={loginAction} />
        <Route path='/register' element={<Register />} action={registerAction} />
        <Route path='events' element={<Events />} loader={getAllEvents} />
        <Route path='app' element={<ProtectedLayout />} action={createEventAction}>
          <Route index element={<CreateEvent />} loader={getAllEvents} />
        </Route>
        <Route path='*' element={<NotFound />} />
      </Route>
    </>
  )
);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;

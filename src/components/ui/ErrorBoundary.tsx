import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';

const ErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const isResponseError = isRouteErrorResponse(error);

  if (isResponseError && error.status === 404) {
    navigate('/', { replace: true });
    return null;
  }
  return (
    <div className='flex flex-col items-center justify-center absolute inset-0'>
      <h1 className='text-4xl font-extrabold lg:text-6xl text-transparent bg-linear-to-r from-[#6054e8] to-[#f8485e] bg-clip-text'>
        {isResponseError ? error.status : 'An Error Occurred'}
      </h1>
      <p className='text-2xl font-bold text-gray-700'>
        {isResponseError
          ? error.data
          : error instanceof Error
          ? error.message
          : 'Something went very wrong'}
        &nbsp;
        <span role='img' aria-labelledby='crying face'>
          😢
        </span>
      </p>
    </div>
  );
};
export default ErrorBoundary;

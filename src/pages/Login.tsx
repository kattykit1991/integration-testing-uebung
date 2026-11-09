import { type AuthActionResult, isErrorResult, isSuccessResult } from '@/types';
import { useEffect } from 'react';
import { Form, useActionData, Link, Navigate } from 'react-router';
import { useAuth } from '@/contexts';

const Login = () => {
  const actionData = useActionData<AuthActionResult>();
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isSuccessResult(actionData)) {
      login(actionData?.token);
    }
  }, [actionData, login]);

  if (isAuthenticated) return <Navigate to='/app' replace />;

  return (
    <div className='flex items-center justify-center absolute inset-0'>
      <div className='w-full max-w-md p-8 space-y-4 bg-base-100 shadow-xl rounded-box'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold'>Sign in to your account</h2>
        </div>
        {isErrorResult(actionData) && (
          <div className='alert alert-error'>
            <span>{actionData.error}</span>
          </div>
        )}
        <Form method='post' className='space-y-4'>
          <div className='form-control'>
            <label htmlFor='email' className='label'>
              <span className='label-text'>Email address</span>
            </label>
            <input
              name='email'
              required
              placeholder='Enter your email'
              className='input input-bordered w-full'
            />
          </div>
          <div className='form-control'>
            <label htmlFor='password' className='label'>
              <span className='label-text'>Password</span>
            </label>
            <input
              name='password'
              type='password'
              placeholder='Enter your password'
              className='input input-bordered w-full'
            />
          </div>
          <div className='form-control'>
            <button type='submit' className='btn btn-primary w-full'>
              Sign in
            </button>
          </div>
          <div className='text-center'>
            <Link to='/register' className='link link-primary'>
              Don’t have an account? Sign up
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;

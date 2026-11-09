import { isErrorResult, isSuccessResult, type CreateActionResult } from '@/types';
import { useEffect, useRef, type RefObject } from 'react';
import { useFetcher } from 'react-router';

export default function CreateEventModal({
  modalRef
}: {
  modalRef: RefObject<HTMLDialogElement | null>;
}) {
  const fetcher = useFetcher<CreateActionResult>();
  const formRef = useRef<HTMLFormElement | null>(null);

  const cleanUp = () => {
    formRef.current?.reset();
    modalRef?.current?.close();
  };

  useEffect(() => {
    if (isSuccessResult(fetcher.data)) {
      cleanUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data]);

  return (
    <dialog ref={modalRef} className='modal' onClose={cleanUp}>
      <div className='modal-box w-full max-w-2xl'>
        <h3 className='font-bold text-xl lg:text-2xl mb-6'>Create New Event</h3>
        {isErrorResult(fetcher.data) && (
          <div className='alert alert-error'>
            <span>{fetcher.data.error}</span>
          </div>
        )}
        <fetcher.Form method='post' action='/app' className='space-y-6' ref={formRef}>
          <div className='form-control'>
            <label className='label' htmlFor='title'>
              <span className='label-text'>Event Title</span>
            </label>
            <input
              name='title'
              type='text'
              placeholder='Summer Gala 2025'
              className='input input-bordered w-full'
            />
          </div>
          <div className='form-control'>
            <label className='label' htmlFor='description'>
              <span className='label-text'>Description</span>
            </label>
            <textarea
              name='description'
              placeholder="Give attendees a taste of what's coming…"
              className='textarea textarea-bordered h-28 resize-none w-full'
            />
          </div>
          <div className='form-control'>
            <label className='label' htmlFor='date'>
              <span className='label-text'>Date & Time</span>
            </label>
            <input name='date' type='datetime-local' className='input input-bordered w-full' />
          </div>
          <div className='form-control'>
            <label className='label' htmlFor='location'>
              <span className='label-text'>Location</span>
            </label>
            <input
              name='location'
              type='text'
              placeholder='Berlin Congress Center'
              className='input input-bordered w-full'
            />
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='form-control'>
              <label className='label' htmlFor='latitude'>
                <span className='label-text'>Latitude</span>
              </label>
              <input
                name='latitude'
                type='number'
                step='any'
                placeholder='52.5200'
                className='input input-bordered w-full'
              />
            </div>
            <div className='form-control'>
              <label className='label' htmlFor='longitude'>
                <span className='label-text'>Longitude</span>
              </label>
              <input
                name='longitude'
                type='number'
                step='any'
                placeholder='13.4050'
                className='input input-bordered w-full'
              />
            </div>
          </div>
          <div className='modal-action mt-8'>
            <button type='button' className='btn btn-ghost' onClick={cleanUp}>
              Cancel
            </button>
            <button type='submit' className='btn btn-primary' disabled={fetcher.state !== 'idle'}>
              Create Event
            </button>
          </div>
        </fetcher.Form>
      </div>
      <form method='dialog' className='modal-backdrop'>
        <button aria-label='Close modal'>close</button>
      </form>
    </dialog>
  );
}

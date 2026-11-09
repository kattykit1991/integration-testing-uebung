import { Link, useLoaderData } from 'react-router';
import { FaCalendarAlt, FaUsers, FaMapMarkerAlt, FaShare } from 'react-icons/fa';

const Home = () => {
  const { userCount, eventsCount } = useLoaderData<{
    userCount: number;
    eventsCount: number;
  }>();

  return (
    <div className='min-h-screen bg-base-100'>
      <div className='hero min-h-screen bg-base-200 relative overflow-hidden'>
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        ></div>
        <div className='hero-content text-center text-neutral-content relative z-10'>
          <div className='max-w-md'>
            <h1 className='mb-5 text-5xl font-bold text-white drop-shadow-lg'>Welcome to Venued</h1>
            <p className='mb-5 text-lg text-white drop-shadow-md'>
              Create unforgettable experiences and share amazing events with your community. From
              intimate gatherings to grand celebrations, make every moment count.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link to='/events' className='btn btn-primary btn-lg'>
                Explore Events
              </Link>
              <Link
                to='/app'
                className='btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary'
              >
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </div>
      <section className='py-20 bg-base-100'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-base-content mb-4'>Why Choose Venued?</h2>
            <p className='text-xl text-base-content/70 max-w-2xl mx-auto'>
              Everything you need to create, manage, and share incredible events
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            <div className='card bg-base-200 shadow-xl'>
              <div className='card-body items-center text-center'>
                <FaCalendarAlt className='text-4xl text-primary mb-4' />
                <h3 className='card-title'>Easy Planning</h3>
                <p>Create and organize events with our intuitive planning tools</p>
              </div>
            </div>
            <div className='card bg-base-200 shadow-xl'>
              <div className='card-body items-center text-center'>
                <FaUsers className='text-4xl text-secondary mb-4' />
                <h3 className='card-title'>Community Driven</h3>
                <p>Connect with like-minded people and build lasting relationships</p>
              </div>
            </div>
            <div className='card bg-base-200 shadow-xl'>
              <div className='card-body items-center text-center'>
                <FaMapMarkerAlt className='text-4xl text-accent mb-4' />
                <h3 className='card-title'>Location Mapping</h3>
                <p>Interactive maps to help attendees find your events easily</p>
              </div>
            </div>
            <div className='card bg-base-200 shadow-xl'>
              <div className='card-body items-center text-center'>
                <FaShare className='text-4xl text-info mb-4' />
                <h3 className='card-title'>Easy Sharing</h3>
                <p>Share your events across social platforms with one click</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className='py-20 bg-gradient-to-r from-primary to-secondary'>
        <div className='container mx-auto px-4'>
          <div className='stats stats-vertical lg:stats-horizontal shadow-xl bg-base-100 w-full'>
            <div className='stat'>
              <div className='stat-figure text-primary'>
                <FaCalendarAlt className='text-3xl' />
              </div>
              <div className='stat-title'>Events Created</div>
              <div className='stat-value text-primary'>{eventsCount}</div>
            </div>
            <div className='stat'>
              <div className='stat-figure text-secondary'>
                <FaUsers className='text-3xl' />
              </div>
              <div className='stat-title'>Active Users</div>
              <div className='stat-value text-secondary'>{userCount}</div>
            </div>
          </div>
        </div>
      </section>
      <section className='py-20 bg-base-100'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-base-content mb-4'>What Our Users Say</h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='card bg-base-200 shadow-xl'>
              <div className='card-body'>
                <div className='flex items-center mb-4'>
                  <div className='avatar'>
                    <div className='w-16 rounded-full'>
                      <img
                        src='https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
                        alt='User'
                      />
                    </div>
                  </div>
                  <div className='ml-4'>
                    <h4 className='font-bold'>Sarah Johnson</h4>
                    <p className='text-sm text-base-content/70'>Event Organizer</p>
                  </div>
                </div>
                <p className='text-base-content/80'>
                  "Venued made organizing our company retreat so much easier. The interface is
                  intuitive and the mapping feature helped everyone find the venue!"
                </p>
              </div>
            </div>
            <div className='card bg-base-200 shadow-xl'>
              <div className='card-body'>
                <div className='flex items-center mb-4'>
                  <div className='avatar'>
                    <div className='w-16 rounded-full'>
                      <img
                        src='https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
                        alt='User'
                      />
                    </div>
                  </div>
                  <div className='ml-4'>
                    <h4 className='font-bold'>Michael Chen</h4>
                    <p className='text-sm text-base-content/70'>Community Leader</p>
                  </div>
                </div>
                <p className='text-base-content/80'>
                  "The community features are amazing! I've connected with so many people through
                  events I discovered on Venued."
                </p>
              </div>
            </div>
            <div className='card bg-base-200 shadow-xl'>
              <div className='card-body'>
                <div className='flex items-center mb-4'>
                  <div className='avatar'>
                    <div className='w-16 rounded-full'>
                      <img
                        src='https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
                        alt='User'
                      />
                    </div>
                  </div>
                  <div className='ml-4'>
                    <h4 className='font-bold'>Emily Rodriguez</h4>
                    <p className='text-sm text-base-content/70'>Wedding Planner</p>
                  </div>
                </div>
                <p className='text-base-content/80'>
                  "As a wedding planner, Venued has streamlined my workflow. My clients love how
                  easy it is to share event details with their guests."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        className='py-20 bg-gradient-to-r from-primary to-secondary relative overflow-hidden'
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className='container mx-auto px-4 text-center relative z-10'>
          <h2 className='text-4xl font-bold text-white mb-4'>Ready to Create Amazing Events?</h2>
          <p className='text-xl text-white/90 mb-8 max-w-2xl mx-auto'>
            Join thousands of event creators who trust Venued to bring their vision to life. Start
            your journey today!
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button className='btn btn-primary btn-lg'>Get Started Free</button>
            <Link
              to='/events'
              className='btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary'
            >
              Browse Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

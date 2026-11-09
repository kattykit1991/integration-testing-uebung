const menuList = [
  { label: 'Home', path: '/', visibility: 'public', cta: false },
  { label: 'Events', path: '/events', visibility: 'public', cta: false },
  { label: 'Register', path: '/register', visibility: 'noauth', cta: true, ctaType: 'btn-primary' },
  { label: 'Login', path: '/login', visibility: 'noauth', cta: true, ctaType: 'btn-secondary' },
  { label: 'Post an Event', path: '/app', visibility: 'private', cta: true, ctaType: 'btn-primary' }
];

export default menuList;

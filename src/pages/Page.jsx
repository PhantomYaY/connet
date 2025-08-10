// This is a redirect component for backward compatibility
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Page = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Redirect to the new note page route with parameters preserved
    const id = searchParams.get('id');
    if (id) {
      navigate(`/page?id=${id}`, { replace: true });
    } else {
      navigate('/page', { replace: true });
    }
  }, [navigate, searchParams]);

  return null;
};

export default Page;

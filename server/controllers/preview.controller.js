const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Fetch link preview data for a given URL using the Microlink API.
 * @route GET /api/link-preview?url=
 */
const getLinkPreview = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ message: 'url query parameter is required' });
  }

  try {
    const response = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true`
    );
    const json = await response.json();
    const data = json.data || {};
    return res.json({
      url,
      title: data.title || '',
      description: data.description || '',
      image: (data.image && data.image.url) || (data.screenshot && data.screenshot.url) || '',
      siteName: data.publisher || '',
    });
  } catch (err) {
    console.error('Link preview error:', err);
    return res.status(500).json({
      url,
      title: url,
      description: '',
      image: '',
      siteName: '',
    });
  }
};

module.exports = { getLinkPreview };


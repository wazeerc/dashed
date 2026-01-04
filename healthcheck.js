const controller = new AbortController();
(async () => {
  try {
    const res = await fetch('http://localhost:3000', { signal: controller.signal });
    clearTimeout(setTimeout(() => controller.abort(), 2500));
    if (res.ok) process.exit(0);
  } catch (err) {}
  process.exit(1);
})();
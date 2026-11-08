document.querySelectorAll('[data-status-filter] select').forEach(select => {
  select.addEventListener('change', () => {
    const url = new URL(location.href);
    if (select.value === 'all') url.searchParams.delete('status');
    else url.searchParams.set('status', select.value);
    url.searchParams.delete('page');
    location.assign(url.toString());
  });
});

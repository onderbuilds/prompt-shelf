import Quill from 'quill/core';
window.mountQuill = (mount) => {
  const q = new Quill(mount, {});
  q.on('text-change', () => window.__onChange && window.__onChange());
  window.__registered = () => q.getText().replace(/\n$/, '');
  return q;
};

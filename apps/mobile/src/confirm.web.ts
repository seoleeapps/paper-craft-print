export async function confirmAction(
  title: string,
  message: string,
  _accept: string,
  _cancel: string,
) {
  return window.confirm(`${title}\n${message}`);
}

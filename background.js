browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_DEV_MODE') {
    browser.management.getSelf().then((info) => {
      sendResponse({ isDevMode: info.installType === 'development' });
    }).catch((err) => {
      console.error(err);
      sendResponse({ isDevMode: false });
    });
    return true;
  }
});

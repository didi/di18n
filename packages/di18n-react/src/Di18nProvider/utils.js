export function getJSON(url, callback) {
  try {
    let request = new XMLHttpRequest();

    // For IE 8/9 CORS support
    if (window.XDomainRequest) {
      request = new window.XDomainRequest();

      if (window.location.href.indexOf('http://') === 0 && url.indexOf('https://') === 0) {
        url = url.replace('https://', 'http://');
      }
    }

    request.open('GET', url, true);
    request.onload = function() {
      if (!request) {
        return;
      }

      const status = request.status;

      const statusCheck = (status >= 200 && status < 300) || status === 304;
      const statusCheckForIE = !('status' in request) && request.responseText;
      if (statusCheck || statusCheckForIE) {
        const data = JSON.parse(request.responseText);
        callback(null, data);
      } else {
        callback(`fetch Error(status: ${status})`);
      }

      // Clean up request
      request = null;
    };

    // For IE 9 CORS support
    // set an empty handler for 'onprogress' so requests don't get aborted
    request.onprogress = function() {};
    request.ontimeout = function() {};

    request.onerror = function() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      callback('Network Error');

      // Clean up request
      request = null;
    };

    request.send();
  } catch (err) {
    if (window.console) {
      console.log(err);
    }
  }
}

export const langKeysMapping = {
  en: 'en-US',
  zh: 'zh-CN',
};

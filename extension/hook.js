// Runs inside the page: watches parsed JSON and passes post facts to the filter.
// It only reads. It sends no requests and changes no responses.
(function () {
  const { collect } = globalThis.HypeGramMedia;
  const seen = new Map();
  let queue = [];
  let timer = 0;

  const flush = () => {
    timer = 0;
    window.postMessage({ source: "hypegram", media: queue }, location.origin);
    queue = [];
  };

  function inspect(data) {
    try {
      if (!data || typeof data !== "object") return;
      for (const m of collect(data)) {
        const merged = { ...seen.get(m.code), ...m };
        seen.set(m.code, merged);
        queue.push(merged);
      }
      if (queue.length && !timer) timer = setTimeout(flush, 30);
    } catch {
      // Never break the page.
    }
  }

  const parse = JSON.parse;
  JSON.parse = function (text, reviver) {
    const data = parse.call(this, text, reviver);
    if (typeof text === "string" && text.length > 200) inspect(data);
    return data;
  };
  const json = Response.prototype.json;
  Response.prototype.json = function () {
    return json.call(this).then((data) => (inspect(data), data));
  };

  // The filter script may start after some data has already gone by.
  window.addEventListener("message", (e) => {
    if (e.source === window && e.data && e.data.source === "hypegram-ready") {
      queue.push(...seen.values());
      if (queue.length && !timer) timer = setTimeout(flush, 0);
    }
  });
})();

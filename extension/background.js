// Development auto-update: reload the unpacked extension when its files on disk change.
// A packaged release has no build.json, so none of this runs there.
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
});

const readBuild = async () => {
  try {
    const r = await fetch(chrome.runtime.getURL("build.json"), { cache: "no-store" });
    return (await r.json()).build;
  } catch {
    return null;
  }
};

const running = readBuild();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type !== "check-build") return;
  (async () => {
    const [mine, disk] = [await running, await readBuild()];
    if (!mine || !disk || mine === disk) return;
    await chrome.storage.local.set({ reloadTabs: true });
    chrome.runtime.reload();
  })();
});

(async () => {
  const { reloadTabs } = await chrome.storage.local.get("reloadTabs");
  if (!reloadTabs) return;
  await chrome.storage.local.remove("reloadTabs");
  for (const tab of await chrome.tabs.query({ url: "https://www.instagram.com/*" })) chrome.tabs.reload(tab.id);
})();

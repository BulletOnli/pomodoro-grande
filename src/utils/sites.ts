export const getBlockedSites = async (): Promise<string[]> => {
  // blockedSites: ['example.com']
  const { blockedSites } = await chrome.storage.local.get("blockedSites");
  return blockedSites;
};

export const getAllowedUrls = async (): Promise<string[]> => {
  // allowedUrls: ['https://www.example.com']
  const { allowedUrls } = await chrome.storage.local.get("allowedUrls");
  return allowedUrls;
};

export const isBlockedSite = async (url: string): Promise<boolean> => {
  const normalizedUrl = new URL(url);
  const urlHostname = normalizedUrl.hostname.replace(/^www\./, "");

  const allowedUrls = (await getAllowedUrls()) || [];
  if (allowedUrls.some((site) => normalizedUrl.href === site)) return false;

  const blockedSites = (await getBlockedSites()) || [];
  return blockedSites.some((site) => urlHostname === site);
};

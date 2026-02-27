import { useState, useEffect, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getBlockedSites } from "@/utils/sites";

const BlockedSites = () => {
  const [sites, setSites] = useState<string[]>([]);
  const [newSite, setNewSite] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getBlockedSites().then((result) => {
      if (result) setSites(result);
    });
  }, []);

  const addSite = (e: FormEvent) => {
    e.preventDefault();

    const urlRegex = /^(https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const match = newSite.match(urlRegex);

    if (!match) {
      setError("Invalid domain or URL.");
      return;
    }

    const domain = match[2]; // Extract the valid domain
    if (domain && !sites.includes(domain)) {
      setSites([domain, ...sites]);
      setNewSite("");
      setError("");
      chrome.storage.local.set({ blockedSites: [domain, ...sites] });
    } else if (sites.includes(domain)) {
      setError("This domain is already in the list.");
    }
  };

  const removeSite = (siteToRemove: string) => {
    const updatedSites = sites.filter((site) => site !== siteToRemove);
    setSites(updatedSites);
    chrome.storage.local.set({ blockedSites: updatedSites });
  };

  return (
    <div className="w-full h-full space-y-2">
      <h1 className="text-base text-center font-semibold mb-2">
        Blocked Domains
      </h1>
      <form onSubmit={addSite} className="flex items-center gap-1">
        <Input
          value={newSite}
          onChange={(e) => setNewSite(e.target.value)}
          placeholder="example.com"
          className="h-8 text-sm placeholder:text-xs"
        />

        <Button
          type="submit"
          className="bg-primary-custom hover:bg-primary-custom/90"
          size="sm"
        >
          Add
        </Button>
      </form>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <ul className="custom-scrollbar max-h-[21rem] overflow-y-auto">
        {sites.length === 0 && (
          <p className="text-sm font-light text-center mt-4">
            No sites blocked yet
          </p>
        )}
        {sites.map((site, index) => (
          <li
            key={index}
            className="flex justify-between items-center p-2 mb-2 rounded shadow"
          >
            <span>{site}</span>
            <button
              onClick={() => removeSite(site)}
              className="text-primary-custom hover:text-primary-custom/90 focus:outline-none"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlockedSites;

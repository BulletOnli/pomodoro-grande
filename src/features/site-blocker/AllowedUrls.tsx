import { useState, useEffect, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllowedUrls } from "@/utils/sites";

const AllowedUrls = () => {
  const [allowedUrls, setAllowedUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAllowedUrls().then((result) => {
      if (result) setAllowedUrls(result);
    });
  }, []);

  const addSite = (e: FormEvent) => {
    e.preventDefault();

    if (newUrl && !allowedUrls.includes(newUrl)) {
      setAllowedUrls([newUrl, ...allowedUrls]);
      setNewUrl("");
      setError("");
      chrome.storage.local.set({ allowedUrls: [newUrl, ...allowedUrls] });
    } else if (allowedUrls.includes(newUrl)) {
      setError("This url is already in the list.");
    }
  };

  const removeSite = (siteToRemove: string) => {
    const updatedUrls = allowedUrls.filter((site) => site !== siteToRemove);
    setAllowedUrls(updatedUrls);
    chrome.storage.local.set({ allowedUrls: updatedUrls });
  };

  return (
    <div className="w-full space-y-2">
      <h1 className="text-base text-center font-semibold mb-2">Allowed Urls</h1>
      <form onSubmit={addSite} className="flex items-center gap-1">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://example.com"
          className="h-8 text-sm placeholder:text-xs"
          type="url"
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
        {allowedUrls.length === 0 && (
          <p className="text-sm font-light text-center mt-4">No sites yet</p>
        )}
        {allowedUrls.map((site, index) => (
          <li
            key={index}
            className="flex justify-between items-center p-2 mb-2 rounded shadow"
          >
            <span className="text-xs max-w-[230px] break-all">{site}</span>
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

export default AllowedUrls;

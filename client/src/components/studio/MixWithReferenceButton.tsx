
import React, { FC, useState } from 'react';
import { mixWithReference } from '../../lib/api';

interface Props { projectId: string; }

export const MixWithReferenceButton: FC<Props> = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleMix = async () => {
    setLoading(true);
    try {
      const url = await mixWithReference(projectId, true);
      setDownloadUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleMix}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        {loading ? 'Mixing...' : 'Mix Like Reference'}
      </button>
      {downloadUrl && (
        <a href={downloadUrl} target="_blank" rel="noopener" className="text-blue-500 underline">
          Download Mix
        </a>
      )}
    </div>
  );
};

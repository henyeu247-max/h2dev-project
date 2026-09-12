'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function writeJson(root, relativePath, value) {
  const absolute = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function vitality() {
  return {
    evaluatedAt: '2026-09-10',
    latestUploadDate: '2026-09-09',
    daysSinceLatest: 1,
    healthStatus: 'ACTIVE',
    healthBadge: 'active fixture',
    healthDetail: 'fixture source',
    monetizationStatus: 'UNKNOWN',
    monetizationBadge: 'unknown fixture',
    monetizationAdvisory: 'fixture only',
    estimatedMonthlyRev: 'UNKNOWN',
  };
}

function video(videoId, referenceStyle, hasTranscript) {
  const transcript = hasTranscript ? `${videoId}_transcript.json` : null;
  const summary = hasTranscript ? `${videoId}_summary_vi.md` : null;
  const prefix = referenceStyle === 'project_prefixed' ? 'data/raw-channels-deep/' : '';
  const folder = referenceStyle === 'project_prefixed' ? (videoId === 'VIDC' ? 'RAW-002_Two' : 'RAW-001_One') : '';
  return {
    rank: 1,
    videoId,
    title: `Fixture video ${videoId}`,
    hasTranscript,
    transcriptJsonRel: hasTranscript ? (referenceStyle === 'project_prefixed' ? `${prefix}${folder}/transcripts/${transcript}` : `transcripts/${transcript}`) : null,
    summaryViRel: hasTranscript ? (referenceStyle === 'project_prefixed' ? `${prefix}${folder}/transcripts/${summary}` : `transcripts/${summary}`) : null,
  };
}

function makeRecord(id, folderName, channelId, topVideosCount, transcriptCount) {
  const channel = { channelId, title: `${id} fixture`, handle: `@${id.toLowerCase()}` };
  return {
    id,
    fileName: `${id}.jpg`,
    channel,
    status: 'VERIFIED_UNIQUE',
    publicVerification: 'UNKNOWN',
    deepIntelligence: {
      status: 'EXTRACTED',
      topVideosCount,
      transcriptsCount: transcriptCount,
      tagsCount: 0,
      folderName,
      dossierPath: `data/raw-channels-deep/${folderName}`,
    },
    vitalityAudit: vitality(),
  };
}

function makeFixture(options = {}) {
  const root = options.root || fs.mkdtempSync(path.join(os.tmpdir(), 'h2dev-a16p-'));
  const folders = {
    'RAW-001': { folderName: 'RAW-001_One', channelId: 'UCfixture001', videos: [video('VIDA', 'folder_relative', true), video('VIDB', 'folder_relative', false)] },
    'RAW-002': { folderName: 'RAW-002_Two', channelId: 'UCfixture002', videos: [video('VIDC', 'project_prefixed', true)] },
  };
  const records = Object.entries(folders).map(([id, spec]) => makeRecord(id, spec.folderName, spec.channelId, spec.videos.length, 1));
  const manifestChannels = Object.entries(folders).map(([id, spec]) => ({
    id,
    title: `${id} fixture`,
    handle: `@${id.toLowerCase()}`,
    channelId: spec.channelId,
    editorialNiche: 'fixture',
    topVideosCount: spec.videos.length,
    transcriptsCount: 0,
    tagsCount: 0,
    folderName: spec.folderName,
    dossierPath: `data/raw-channels-deep/${spec.folderName}`,
  }));
  const metadataRecords = records.map((record) => ({
    ...JSON.parse(JSON.stringify(record)),
    // This is the intentionally stale projection that A16-P repairs.
    deepIntelligence: { ...record.deepIntelligence, transcriptsCount: 0 },
  }));
  writeJson(root, 'data-tabs/raw-kenh-mau.json', {
    schema: 'fixture.raw.v1', updatedAt: '2026-09-10', totalRecords: records.length, records,
  });
  writeJson(root, 'data/raw-channels-deep/deep-channels-manifest.json', {
    generatedAt: '2026-09-10', totalChannelsProcessed: records.length, channels: manifestChannels,
  });
  writeJson(root, 'raw-kenh-goc/metadata-full.json', {
    schema: 'fixture.metadata.v1', updatedAt: '2026-09-10', totalRecords: metadataRecords.length, records: metadataRecords,
  });
  for (const [id, spec] of Object.entries(folders)) {
    const base = `data/raw-channels-deep/${spec.folderName}`;
    writeJson(root, `${base}/top-videos.json`, {
      channelId: spec.channelId,
      rawId: id,
      totalVideos: spec.videos.length,
      videos: spec.videos,
      transcriptsCount: 0,
    });
    writeJson(root, `${base}/channel-profile.json`, {
      id,
      channelId: spec.channelId,
      title: `${id} fixture`,
      summaryStats: {
        topVideosCollected: spec.videos.length,
        transcriptsExtracted: 0,
      },
      vitalityAudit: vitality(),
    });
    const transcriptDir = path.join(root, base, 'transcripts');
    fs.mkdirSync(transcriptDir, { recursive: true });
    for (const current of spec.videos.filter((item) => item.hasTranscript)) {
      writeJson(root, `${base}/transcripts/${current.videoId}_transcript.json`, {
        videoId: current.videoId,
        title: current.title,
        segments: [{ start: 0, duration: 1, text: 'fixture transcript' }],
      });
      fs.writeFileSync(path.join(transcriptDir, `${current.videoId}_summary_vi.md`), '# Fixture summary\n', 'utf8');
    }
  }
  return { root, records, folders };
}

module.exports = { makeFixture };

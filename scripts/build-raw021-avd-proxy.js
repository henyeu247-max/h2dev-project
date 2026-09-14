const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOSSIER = path.join(PROJECT_ROOT, 'data', 'raw-channels-deep', 'RAW-021_Hidden_Planet_Docs');
const PROFILE_PATH = path.join(DOSSIER, 'channel-profile.json');
const TOOLKIT_PATH = path.join(DOSSIER, 'production_toolkit.json');
const TOP_VIDEOS_PATH = path.join(DOSSIER, 'top-videos.json');
const COMPUTED_AT = new Date().toISOString();

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value, digits = 1) => Number(value.toFixed(digits));
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

function parseDuration(value) {
  if (!value) return 0;
  const match = String(value).match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function minMaxScale(value, values) {
  const usable = values.filter((item) => Number.isFinite(item));
  if (!usable.length || !Number.isFinite(value)) return null;
  const min = Math.min(...usable);
  const max = Math.max(...usable);
  if (max === min) return 50;
  return clamp(((value - min) / (max - min)) * 100);
}

function logScale(value, values) {
  const usable = values.filter((item) => Number.isFinite(item) && item >= 0).map((item) => Math.log10(item + 1));
  if (!Number.isFinite(value) || value < 0 || !usable.length) return null;
  const scaled = minMaxScale(Math.log10(value + 1), usable);
  return scaled == null ? null : scaled;
}

const profile = readJson(PROFILE_PATH);
const toolkit = readJson(TOOLKIT_PATH);
const topVideos = readJson(TOP_VIDEOS_PATH);
const videos = Array.isArray(topVideos.videos) ? topVideos.videos : [];
const publicVideos = videos.filter((video) => Number.isFinite(Number(video.views)));
const vphValues = publicVideos.map((video) => Number(video.vph)).filter(Number.isFinite);
const breakoutValues = publicVideos.map((video) => Number(video.breakoutScore)).filter(Number.isFinite);
const viewValues = publicVideos.map((video) => Number(video.views)).filter(Number.isFinite);
const videoEvidence = [];

for (const video of publicVideos) {
  const transcriptPath = path.join(DOSSIER, video.transcriptJsonRel || '');
  let segments = [];
  let transcriptReadable = false;
  if (video.transcriptJsonRel && fs.existsSync(transcriptPath)) {
    try {
      const transcript = readJson(transcriptPath);
      segments = Array.isArray(transcript) ? transcript : (Array.isArray(transcript.segments) ? transcript.segments : []);
      transcriptReadable = segments.length > 0;
    } catch (_) {}
  }
  const first60 = segments.filter((segment) => Number(segment.start || 0) <= 60);
  const allText = segments.map((segment) => String(segment.text || '')).join(' ');
  const first60Text = first60.map((segment) => String(segment.text || '')).join(' ').trim();
  const cueMatches = allText.match(/\b(however|but|yet|until|the truth|what if|the question|remarkable|mystery|impossible)\b/gi) || [];
  const questionMatches = first60Text.match(/\?/g) || [];
  const durationSeconds = parseDuration(video.duration);
  const expectedSegments = Number(video.segmentCount || 0);
  const segmentCountMatch = expectedSegments > 0 && segments.length === expectedSegments;
  const hookEvidence = first60Text.length >= 40 ? 100 : (first60Text.length > 0 ? 60 : 0);
  const pacingEvidence = durationSeconds > 0 && segments.length > 0
    ? clamp((segments.length / (durationSeconds / 60)) / 18 * 100)
    : 0;
  const transcriptIntegrity = transcriptReadable && segmentCountMatch ? 100 : (transcriptReadable ? 70 : 0);
  const performanceParts = [
    { name: 'views', score: logScale(Number(video.views), viewValues), weight: 0.4 },
    { name: 'vph', score: logScale(Number(video.vph), vphValues), weight: 0.35 },
    { name: 'breakoutScore', score: minMaxScale(Number(video.breakoutScore), breakoutValues), weight: 0.25 }
  ].filter((part) => part.score != null);
  const performanceSignal = performanceParts.length
    ? performanceParts.reduce((sum, part) => sum + part.score * part.weight, 0) / performanceParts.reduce((sum, part) => sum + part.weight, 0)
    : 0;
  const structureSignal = (hookEvidence * 0.4) + (pacingEvidence * 0.35) + (transcriptIntegrity * 0.25);
  const publicRetentionSignal = Math.round((performanceSignal * 0.7) + (structureSignal * 0.3));

  videoEvidence.push({
    videoId: video.videoId,
    title: video.title,
    sourceRank: video.sourceRank,
    displayRank: video.displayRank,
    duration: video.duration,
    views: video.views,
    vph: video.vph,
    breakoutScore: video.breakoutScore,
    publicRetentionSignalScore: publicRetentionSignal,
    evidence: {
      transcriptPath: video.transcriptJsonRel || null,
      transcriptReadable,
      transcriptSegmentsObserved: segments.length,
      transcriptSegmentsDeclared: expectedSegments || null,
      transcriptSegmentCountMatch: segmentCountMatch,
      first60sTextChars: first60Text.length,
      first60sQuestionCueCount: questionMatches.length,
      pacingCueCount: cueMatches.length,
      hookEvidenceScore: hookEvidence,
      pacingEvidenceScore: round(pacingEvidence),
      transcriptIntegrityScore: transcriptIntegrity
    }
  });
}

const channelScore = videoEvidence.length
  ? Math.round(videoEvidence.reduce((sum, item) => sum + item.publicRetentionSignalScore, 0) / videoEvidence.length)
  : 0;
const transcriptComplete = videoEvidence.filter((item) => item.evidence.transcriptReadable && item.evidence.transcriptSegmentCountMatch).length;
const proxy = {
  schema: 'h2dev.public-retention-signal.v1',
  status: 'PROXY_ONLY',
  label: 'Public retention signal (not actual AVD)',
  publicRetentionSignalScore: channelScore,
  scoreRange: '0-100 heuristic score; not a percentage, not minutes, not retention rate',
  confidence: 'MEDIUM',
  confidenceReason: '10/10 public transcript records are readable, but channel-owner YouTube Analytics is unavailable.',
  computedAt: COMPUTED_AT,
  methodology: {
    summary: 'Estimate public signals associated with audience retention without claiming private Analytics metrics.',
    formula: 'Per video: 70% public performance signal + 30% transcript structure signal; channel score = mean across audited videos.',
    publicPerformanceSignal: '40% log-scaled views + 35% log-scaled VPH + 25% normalized breakoutScore, using only the 10 audited videos.',
    transcriptStructureSignal: '40% first-60s hook evidence + 35% transcript pacing density + 25% transcript integrity.',
    normalizationScope: 'RAW-021 top-videos.json only; scores are comparative within this audited set.'
  },
  coverage: {
    topVideosAudited: videoEvidence.length,
    topVideosDeclared: Number(topVideos.totalVideos || videos.length),
    transcriptRecordsComplete: transcriptComplete,
    transcriptRecordsDeclared: Number(topVideos.transcriptsCount || videos.length),
    coveragePass: videoEvidence.length === Number(topVideos.totalVideos || videos.length) && transcriptComplete === videoEvidence.length
  },
  channelEvidence: {
    source: 'data/raw-channels-deep/RAW-021_Hidden_Planet_Docs/top-videos.json',
    fieldsUsed: ['views', 'vph', 'breakoutScore', 'duration', 'segmentCount', 'transcriptJsonRel'],
    videoIds: videoEvidence.map((item) => item.videoId)
  },
  videoEvidence,
  notMeasured: [
    'Average view duration (minutes)',
    'Audience retention percentage or curve',
    '30-second intro retention',
    'Rewatches, exits, skips, and end-screen behavior',
    'Private YouTube Analytics data'
  ],
  sources: [
    {
      title: 'YouTube Analytics overview',
      url: 'https://support.google.com/youtube/answer/9002587',
      relevance: 'Average view duration appears as a YouTube Analytics metric.'
    },
    {
      title: 'YouTube audience retention',
      url: 'https://support.google.com/youtube/answer/9313698',
      relevance: 'Audience retention measures how well a video keeps viewers watching over time.'
    },
    {
      title: 'Measuring important moments for audience retention',
      url: 'https://support.google.com/youtube/answer/9314415',
      relevance: 'Retention reports are video-level Analytics evidence, unavailable in a public channel snapshot.'
    }
  ],
  interpretation: 'Use only to prioritize videos and inspect structure. Do not report this score as AVD, retention percentage, or watch time.'
};

profile.retentionAvdProxy = proxy;
profile.dataGaps = profile.dataGaps || {};
profile.dataGaps.retentionAvdProxy = {
  status: 'PROXY_ONLY',
  currentEvidence: `Computed ${channelScore}/100 public retention signal from ${videoEvidence.length}/${Number(topVideos.totalVideos || videos.length)} audited videos and ${transcriptComplete}/${videoEvidence.length} transcript records.`,
  whyItMatters: 'Public signals can prioritize reverse-engineering, but they cannot replace video-level YouTube Analytics.',
  nextCheck: 'If owner Analytics is supplied, compare actual averageViewDuration and audienceRetention with this proxy; otherwise keep PROXY_ONLY.',
  source: 'data/raw-channels-deep/RAW-021_Hidden_Planet_Docs/top-videos.json + transcripts/*.json',
  measured: ['views', 'vph', 'breakoutScore', 'transcript coverage', 'first-60s text evidence', 'transcript pacing density'],
  notMeasured: proxy.notMeasured
};
toolkit.retentionAvdProxy = proxy;
toolkit.dataGaps = toolkit.dataGaps || {};
toolkit.dataGaps.retentionAvdProxy = profile.dataGaps.retentionAvdProxy;

fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2) + '\n', 'utf8');
fs.writeFileSync(TOOLKIT_PATH, JSON.stringify(toolkit, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({
  status: proxy.status,
  publicRetentionSignalScore: proxy.publicRetentionSignalScore,
  confidence: proxy.confidence,
  videosAudited: videoEvidence.length,
  transcriptsComplete: transcriptComplete,
  computedAt: COMPUTED_AT
}, null, 2));

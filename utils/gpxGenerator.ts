import { WorkoutSession, GpsCoordinate } from '@/services/workout/workoutTypes';

/**
 * Generates a standard GPX v1.1 XML string compatible with Strava, Garmin Connect, & Apple Fitness.
 */
export const generateGpxString = (session: WorkoutSession): string => {
  const name = session.exerciseName || 'HealthSense Workout Session';
  const startTimeISO = new Date(session.startedAt).toISOString();

  let gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="HealthSense Watch & Fitness Platform"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    <time>${startTimeISO}</time>
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <type>${session.category || 'RUNNING'}</type>
    <trkseg>
`;

  const trackPoints: GpsCoordinate[] = session.gpsTrack || [];

  if (trackPoints.length === 0) {
    // If no real GPS points, generate a dummy point for metadata integrity
    gpxXml += `      <trkpt lat="10.762622" lon="106.660172">
        <time>${startTimeISO}</time>
`;
    if (session.avgHeartRate) {
      gpxXml += `        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>${session.avgHeartRate}</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
`;
    }
    gpxXml += `      </trkpt>\n`;
  } else {
    for (const point of trackPoints) {
      const timeISO = point.timestamp ? new Date(point.timestamp).toISOString() : startTimeISO;
      const lat = point.latitude.toFixed(6);
      const lon = point.longitude.toFixed(6);

      gpxXml += `      <trkpt lat="${lat}" lon="${lon}">\n`;
      if (point.altitude !== undefined) {
        gpxXml += `        <ele>${point.altitude.toFixed(1)}</ele>\n`;
      }
      gpxXml += `        <time>${timeISO}</time>\n`;

      if (session.avgHeartRate) {
        gpxXml += `        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>${session.avgHeartRate}</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>\n`;
      }
      gpxXml += `      </trkpt>\n`;
    }
  }

  gpxXml += `    </trkseg>
  </trk>
</gpx>`;

  return gpxXml;
};

const escapeXml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

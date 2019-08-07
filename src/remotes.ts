import 'dotenv/config';

const MAPBOX_API_ENDPOINT = 'https://api.mapbox.com';
const ACCESS_TOKEN = process.env.MAPBOX_API_TOKEN;

type Remote = {
  name: string;
  location: string;
};

export type RemoteWithLocationData = Remote & {
  coordLngLat: [number, number] | null;
  timezone: string | null;
};

const remotes: Remote[] = [
  { name: 'Tim', location: 'Bengaluru, India' },
  { name: 'James, Talos, Dan L', location: 'Manhattan, New York, United States' },
  { name: 'Kamal', location: 'Montreal, Quebec, Canada' },
  { name: 'Gediminas', location: 'Vilnius, Lithuania' },
  { name: 'Jerry', location: 'Sydney, Australia' },
  { name: 'Ivan', location: 'Sofia, Bulgaria' },
  { name: 'Luke', location: 'Raleigh, North Carolina, United States' },
  { name: 'Andy', location: 'Omaha, Nebraska, United States' },
  { name: 'Andrew', location: 'Split, Croatia' },
  { name: 'SF', location: 'San Francisco, California, United States' },
  { name: '𝐃𝐚𝐧 𝐑𝐨𝐛𝐢𝐧𝐬𝐨𝐧, 𝐂𝐓𝐎', location: 'San Francisco, California, United States' },
  { name: 'Kevin', location: 'Salt Lake City, Utah, United States' },
  { name: 'Cameron', location: 'Wagga Wagga, NSW, Australia' },
  { name: 'Greg and Michael', location: 'St. Louis, Missouri, United States' },
  { name: 'Howie', location: 'Austin, Texas, United States' },
];

export function fetchRemotes(): Promise<RemoteWithLocationData[]> {
  const tasks = remotes.map(async remote => {
    const coordLngLat: [number, number] | null = await fetch(
      `${MAPBOX_API_ENDPOINT}/geocoding/v5/mapbox.places/${
        remote.location
      }.json?access_token=${ACCESS_TOKEN}&types=place&limit=1`,
    )
      .then(res => res.json())
      .then(json =>
        json.features && json.features.length > 0
          ? json.features[0].center
          : null,
      );

    const timezone = coordLngLat
      ? await fetch(
          `${MAPBOX_API_ENDPOINT}/v4/examples.4ze9z6tv/tilequery/${coordLngLat[0]},${coordLngLat[1]}.json?access_token=${ACCESS_TOKEN}`,
        )
          .then(res => res.json())
          .then(json =>
            json.features && json.features.length > 0
              ? json.features[0].properties.TZID
              : null,
          )
      : null;

    return {
      ...remote, timezone,
      coordLngLat
    };
  });

  return Promise.all(tasks);
}

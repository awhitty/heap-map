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
  { name: 'Tim', location: 'San Francisco, California, USA' },
  { name: 'James and Talos', location: 'San Francisco, California, USA' },
  { name: 'Marconi', location: 'Toronto, Ontario, Canada' },
  { name: 'Kamal', location: 'San Francisco, California, USA' },
  { name: 'Gediminas', location: 'San Francisco, California, USA' },
  { name: 'Jerry', location: 'San Francisco, California, USA' },
  { name: 'Ivan', location: 'San Francisco, California, USA' },
  { name: 'Luke', location: 'San Francisco, California, USA' },
  { name: 'Andy', location: 'San Francisco, California, USA' },
  { name: 'Andrew', location: 'San Francisco, California, USA' },
  { name: 'SF', location: 'San Francisco, California, USA' },
  { name: 'Kevin', location: 'San Francisco, California, USA' },
  { name: 'Cameron', location: 'San Francisco, California, USA' },
  { name: 'Greg', location: 'San Francisco, California, USA' },
  { name: 'Dustin', location: 'San Francisco, California, USA' },
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

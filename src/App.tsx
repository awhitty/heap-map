import * as React from 'react';
import { DateTime } from 'luxon';
import {
  geoEquirectangular,
  forceSimulation,
  SimulationNodeDatum,
  forceManyBody,
  forceLink,
} from 'd3';

import { getEarthInfo, EarthInfo } from './daylight_map/earth_info';
import { GLMapRenderer } from './daylight_map/map_renderer';

import dayImgSrc from './basemaps/day_4800.jpg';
import nightImgSrc from './basemaps/night_4800.jpg';
import { fetchRemotes, RemoteWithLocationData } from './remotes';
import { AnchorNode, LabelNode, Labeler } from './labeler';

const SYSTEM_FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`;

interface RemoteLabelProps {
  remote: RemoteWithLocationData;
  time: number;
  centerY: number;
  centerX: number;
}

function RemoteLabel({ remote, time, centerY, centerX }: RemoteLabelProps) {
  const formattedTime = remote.timezone
    ? DateTime.fromMillis(time)
        .setZone(remote.timezone)
        .toLocaleString(DateTime.TIME_SIMPLE)
    : null;

  return (
    <div
      key={remote.name}
      title={remote.name}
      style={{
        position: 'absolute',
        left: centerX,
        top: centerY,
        transform: 'translate(-50%, -50%)',
        background: '#fff',
        padding: '4px 8px',
        borderRadius: '4px',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,.1)',
        fontFamily: SYSTEM_FONT,
        fontSize: '16px',
        lineHeight: '20px',
      }}
    >
      {remote.name}{' '}
      {formattedTime && (
        <span style={{ fontSize: '11px', color: '#666' }}>
          {'· '}
          {formattedTime}
        </span>
      )}
    </div>
  );
}

function fetchImage(url: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = url;
  });
}

export class App extends React.Component {
  canvas: HTMLCanvasElement | null = null;
  mapRenderer: GLMapRenderer | null = null;
  interval: any;

  state = {
    time: DateTime.local().toMillis(),
    pageWidth: 0,
    anchors: [] as AnchorNode<RemoteWithLocationData>[],
    labels: [] as LabelNode<RemoteWithLocationData>[],
  };

  get width(): number {
    return this.state.pageWidth;
  }

  get height(): number {
    return this.state.pageWidth / 2;
  }

  get projection(): d3.GeoProjection {
    // NOTE: D3 uses a default width of 960
    const scale = (geoEquirectangular().scale() / 960) * this.width;
    return geoEquirectangular()
      .scale(scale)
      .translate([this.width / 2, this.height / 2]);
  }

  componentDidMount() {
    this.setState({ pageWidth: document.body.clientWidth });
    this.setupAndDrawMap();
    this.fetchRemotes();
    this.startUpdatingTimer();
    this.interval = setInterval(() => this.fetchRemotes(), 1000 * 60 * 60 * 24);
  }

  render() {
    return (
      <div
        style={{
          background: '#000',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: this.width,
            height: this.height,
          }}
        >
          <canvas
            width={this.width * 2}
            height={this.height * 2}
            ref={node => (this.canvas = node)}
            style={{
              position: 'absolute',
              transformOrigin: '0 0',
              transform: 'scale(0.5)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: this.width,
              height: this.height,
            }}
          >
            {this.renderRemotes()}
          </div>
        </div>
      </div>
    );
  }

  private renderRemotes = () => {
    const currentTime = this.state.time;
    return (
      <>
        <svg
          width={this.width}
          height={this.height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {this.state.labels.map((label, i) => (
            <line x1={label.x} y1={label.y} x2={this.state.anchors[i].x} y2={this.state.anchors[i].y} stroke="#fff" />
          ))}
        </svg>
        {this.state.anchors.map(anchor => (
          <div
            key={`point__${anchor.value.name}`}
            title={anchor.value.name}
            style={{
              position: 'absolute',
              left: anchor.x,
              top: anchor.y,
              transform: 'translate(-50%, -50%)',
              border: '2px solid #fff',
              width: 10,
              height: 10,
              borderRadius: '100px',
              boxShadow:
                '0px 2px 4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,.1)',
            }}
          />
        ))}
        {this.state.labels.map(label => (
          <RemoteLabel
            key={`label__${label.value.name}`}
            centerX={label.x}
            centerY={label.y}
            remote={label.value}
            time={currentTime}
          />
        ))}
      </>
    );
  };

  private renderRemoteLabel = (remote: RemoteWithLocationData) => {
    if (!remote.coordLngLat) {
      return null;
    }

    const [x, y] = this.projection(remote.coordLngLat)!;
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const currentTime = this.state.time;

    return (
      <RemoteLabel
        remote={remote}
        time={currentTime}
        centerX={roundedX}
        centerY={roundedY}
      />
    );
  };

  private startUpdatingTimer() {
    setInterval(() => {
      const time = DateTime.local().toMillis();
      this.setState({ time });
      this.renderMap();
    }, 1000);
  }

  private async fetchRemotes() {
    const remotes = await fetchRemotes();
    const anchors: AnchorNode<RemoteWithLocationData>[] = remotes.map(remote => {
      const [x, y] = this.projection(remote.coordLngLat!)!;
      return {
        x,
        y,
        r: 5,
        value: remote,
      };
    });

    const labels: LabelNode<RemoteWithLocationData>[] = anchors.map(anchor => ({
      x: anchor.x,
      y: anchor.y,
      value: anchor.value,
      width: 140,
      height: 30,
    }));

    const labeler = new Labeler(
      this.width,
      this.height,
      labels,
      anchors
    );

    labeler.start(2000);
    this.setState({ anchors, labels });
  }

  private async setupAndDrawMap() {
    const dayImg = await fetchImage(dayImgSrc);
    const nightImg = await fetchImage(nightImgSrc);
    this.mapRenderer = new GLMapRenderer(this.canvas!, dayImg, nightImg);
    this.mapRenderer!.buildProgram();
    this.renderMap();
  }

  private renderMap() {
    if (this.mapRenderer) {
      this.mapRenderer.render(this.getEarthInfo());
    }
  }

  private getEarthInfo(): EarthInfo {
    return getEarthInfo(DateTime.fromMillis(this.state.time));
  }
}

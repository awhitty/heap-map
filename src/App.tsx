import * as React from 'react';
import { DateTime } from 'luxon';
import * as d3 from 'd3-geo';

import { getEarthInfo, EarthInfo } from './daylight_map/earth_info';
import { GLMapRenderer } from './daylight_map/map_renderer';

import dayImgSrc from './basemaps/day_4800.jpg';
import nightImgSrc from './basemaps/night_4800.jpg';
import { fetchRemotes, RemoteWithLocationData } from './remotes';

function isProduction() {
  return process.env.NODE_ENVIRONMENT === 'production';
}

const SYSTEM_FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`;
const COMMIT_REF = isProduction() ? process.env.COMMIT_REF : 'NO_REF';

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

  state = {
    time: DateTime.local().toMillis(),
    pageWidth: 0,
    remotes: [],
  };

  get width(): number {
    return this.state.pageWidth;
  }

  get height(): number {
    return this.state.pageWidth / 2;
  }

  get projection(): d3.GeoProjection {
    // NOTE: D3 uses a default width of 960
    const scale = (d3.geoEquirectangular().scale() / 960) * this.width;
    return d3
      .geoEquirectangular()
      .scale(scale)
      .translate([this.width / 2, this.height / 2]);
  }

  componentDidMount() {
    this.setState({ pageWidth: document.body.clientWidth });
    this.setupAndDrawMap();
    this.fetchRemotes();
    this.startUpdatingTimer();
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
            <div>{this.state.remotes.map(this.renderRemoteLabel)}</div>
          </div>
        </div>
      </div>
    );
  }

  private renderRemoteLabel = (remote: RemoteWithLocationData) => {
    if (!remote.coordLngLat) {
      return null;
    }

    const [x, y] = this.projection(remote.coordLngLat)!;
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const formattedTime = remote.timezone
      ? DateTime.fromMillis(this.state.time)
          .setZone(remote.timezone)
          .toLocaleString(DateTime.TIME_SIMPLE)
      : null;
    return (
      <div
        key={remote.name}
        title={remote.name}
        style={{
          position: 'absolute',
          left: roundedX,
          top: roundedY,
          transform: 'translateY(-50%)',
          background: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          boxShadow:
            '0px 2px 4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,.1)',
          fontFamily: SYSTEM_FONT,
          fontSize: '16px',
          lineHeight: '20px',
        }}
      >
        <div>{remote.name}</div>
        {formattedTime &&
          <div style={{fontSize:'11px', color: '#666'}}>{ formattedTime }</div>
        }
      </div>
    );
  };

  private startUpdatingTimer() {
    setInterval(() => {
      const time = DateTime.local().toMillis();
      this.setState({time});
      this.renderMap();
      this.checkDeployedCommit();
    }, 1000);
  }

  private async checkDeployedCommit() {
    if (isProduction()) {
      const {ref} = await fetch('/.netlify/functions/ref').then(res => res.json());
      if (ref !== COMMIT_REF) {
        location.reload();
      }
    }
  }

  private async fetchRemotes() {
    const remotes = await fetchRemotes();
    this.setState({ remotes });
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

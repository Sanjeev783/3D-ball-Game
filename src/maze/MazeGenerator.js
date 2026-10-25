/**
 * MazeGenerator.js
 * Generates a huge, complex, multi-level 3D maze structure.
 * Includes:
 * - Long corridors and narrow passages
 * - Sharp 90-degree turns and dead ends
 * - Wide open central chambers
 * - Elevated platforms, bridges, ramps, and drop sections
 * - Guaranteed solvability from start to finish via BFS path verification
 */

export class MazeGenerator {
  constructor(size = 17, options = {}) {
    // Ensure size is odd
    this.size = size % 2 === 0 ? size + 1 : size;
    this.options = options;
    this.elevatedSectors = options.elevatedSectors || [
      { x1: 0.55, x2: 0.85, z1: 0.15, z2: 0.45, maxRamps: 3 }
    ];
    this.grid = []; // 2D array of cells
    this.startPos = { x: 1, z: 1, level: 0 };
    this.endPos = { x: this.size - 2, z: this.size - 2, level: 0 };
    this.ramps = []; // Sloped ramp connections: [{ fromX, fromZ, toX, toZ, dir }]
    this.elevatedCells = new Set(); // Coordinates of level 1 elevated catwalks/bridges
    this.bridges = []; // Bridges passing over ground corridors
    this.solutionPath = [];
  }

  generate() {
    this._initGrid();
    this._carveMazePaths();
    this._carveOpenChambers();
    this._createBraidLoops();
    this._designateVerticality();
    this._ensureSolvable();
    return this.getExportData();
  }

  _initGrid() {
    this.grid = [];
    for (let z = 0; z < this.size; z++) {
      const row = [];
      for (let x = 0; x < this.size; x++) {
        // 1 = Wall, 0 = Open path
        row.push(1);
      }
      this.grid.push(row);
    }
  }

  /**
   * Recursive backtracker / Randomized DFS to carve base maze passages
   */
  _carveMazePaths() {
    const stack = [];
    const startX = 1;
    const startZ = 1;

    this.grid[startZ][startX] = 0;
    stack.push({ x: startX, z: startZ });

    const directions = [
      { dx: 0, dz: -2 }, // North
      { dx: 0, dz: 2 },  // South
      { dx: 2, dz: 0 },  // East
      { dx: -2, dz: 0 }  // West
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];

      // Shuffle directions for organic layout
      const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);

      for (const dir of shuffledDirs) {
        const nx = current.x + dir.dx;
        const nz = current.z + dir.dz;

        if (nx > 0 && nx < this.size - 1 && nz > 0 && nz < this.size - 1) {
          if (this.grid[nz][nx] === 1) {
            neighbors.push({
              x: nx,
              z: nz,
              wallX: current.x + dir.dx / 2,
              wallZ: current.z + dir.dz / 2
            });
          }
        }
      }

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        // Carve wall between current and next
        this.grid[next.wallZ][next.wallX] = 0;
        // Carve destination cell
        this.grid[next.z][next.x] = 0;
        stack.push({ x: next.x, z: next.z });
      } else {
        stack.pop();
      }
    }
  }

  /**
   * Carves 1-2 wide open plazas/chambers (e.g. 3x3 open zones) for scale variation
   */
  _carveOpenChambers() {
    const mid = Math.floor(this.size / 2);
    // Central industrial hub chamber
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        this.grid[mid + dz][mid + dx] = 0;
      }
    }

    // Side chamber
    const quarter = Math.floor(this.size / 4);
    for (let dz = 0; dz <= 1; dz++) {
      for (let dx = 0; dx <= 1; dx++) {
        this.grid[quarter + dz][quarter * 3 + dx] = 0;
      }
    }
  }

  /**
   * Removes some dead ends to create multiple routes, loops, and tactical options
   */
  _createBraidLoops() {
    for (let z = 2; z < this.size - 2; z += 2) {
      for (let x = 2; x < this.size - 2; x += 2) {
        if (this.grid[z][x] === 1 && Math.random() < 0.22) {
          // Check if connecting two open passages
          const horizontal = this.grid[z][x - 1] === 0 && this.grid[z][x + 1] === 0;
          const vertical = this.grid[z - 1][x] === 0 && this.grid[z + 1][x] === 0;
          if (horizontal || vertical) {
            this.grid[z][x] = 0;
          }
        }
      }
    }
  }

  /**
   * Designates elevated platforms, ramps, and bridges
   */
  _designateVerticality() {
    this.elevatedCells.clear();
    this.ramps = [];
    this.bridges = [];

    const cardinalDirs = [
      { dx: 1, dz: 0, dir: 'E' },
      { dx: -1, dz: 0, dir: 'W' },
      { dx: 0, dz: 1, dir: 'S' },
      { dx: 0, dz: -1, dir: 'N' }
    ];

    // Build configured elevated sectors
    for (const sector of this.elevatedSectors) {
      const startX = Math.floor(this.size * (sector.x1 || 0.5));
      const endX = Math.floor(this.size * (sector.x2 || 0.8));
      const startZ = Math.floor(this.size * (sector.z1 || 0.2));
      const endZ = Math.floor(this.size * (sector.z2 || 0.5));
      const maxRamps = sector.maxRamps || 2;

      // Identify open cells in this zone to elevate
      const candidateCells = [];
      for (let z = startZ; z <= endZ; z++) {
        for (let x = startX; x <= endX; x++) {
          if (x > 0 && x < this.size - 1 && z > 0 && z < this.size - 1) {
            if (this.grid[z][x] === 0) {
              candidateCells.push({ x, z });
            }
          }
        }
      }

      // Elevate this sector
      for (const cell of candidateCells) {
        this.elevatedCells.add(`${cell.x},${cell.z}`);
      }

      // Connect elevated sector to ground with ramps
      let rampsPlaced = 0;
      for (const cell of candidateCells) {
        if (rampsPlaced >= maxRamps) break;
        for (const d of cardinalDirs) {
          const adjX = cell.x + d.dx;
          const adjZ = cell.z + d.dz;
          if (
            adjX > 0 && adjX < this.size - 1 &&
            adjZ > 0 && adjZ < this.size - 1 &&
            this.grid[adjZ][adjX] === 0 &&
            !this.elevatedCells.has(`${adjX},${adjZ}`)
          ) {
            this.ramps.push({
              groundX: adjX,
              groundZ: adjZ,
              elevX: cell.x,
              elevZ: cell.z,
              direction: d.dir
            });
            rampsPlaced++;
            break;
          }
        }
      }
    }

    // Region 2: Central Bridge overpass crossing over a ground corridor
    const mid = Math.floor(this.size / 2);
    // If bridge can cross from (mid-3, mid) to (mid+3, mid)
    if (this.grid[mid][mid] === 0) {
      this.bridges.push({
        x: mid,
        z: mid,
        axis: 'z', // Crossing north-south
        height: 3.5
      });
    }
  }

  /**
   * BFS pathfinder ensures the maze is 100% solvable and finds shortest path
   */
  _ensureSolvable() {
    let path = this._findPathBFS(this.startPos, this.endPos);

    if (!path || path.length === 0) {
      // Carve a guaranteed route if RNG sealed it
      let cx = this.startPos.x;
      let cz = this.startPos.z;
      while (cx < this.endPos.x) {
        this.grid[cz][cx] = 0;
        cx++;
      }
      while (cz < this.endPos.z) {
        this.grid[cz][cx] = 0;
        cz++;
      }
      this.grid[this.endPos.z][this.endPos.x] = 0;
      path = this._findPathBFS(this.startPos, this.endPos);
    }

    this.solutionPath = path || [];
  }

  _findPathBFS(start, end) {
    const queue = [[start]];
    const visited = new Set();
    visited.add(`${start.x},${start.z}`);

    const dirs = [
      { dx: 1, dz: 0 },
      { dx: -1, dz: 0 },
      { dx: 0, dz: 1 },
      { dx: 0, dz: -1 }
    ];

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current.x === end.x && current.z === end.z) {
        return path;
      }

      for (const d of dirs) {
        const nx = current.x + d.dx;
        const nz = current.z + d.dz;
        const key = `${nx},${nz}`;

        if (
          nx >= 0 && nx < this.size &&
          nz >= 0 && nz < this.size &&
          this.grid[nz][nx] === 0 &&
          !visited.has(key)
        ) {
          visited.add(key);
          queue.push([...path, { x: nx, z: nz }]);
        }
      }
    }
    return null;
  }

  getExportData() {
    return {
      size: this.size,
      grid: this.grid,
      startPos: this.startPos,
      endPos: this.endPos,
      ramps: this.ramps,
      elevatedCells: Array.from(this.elevatedCells),
      bridges: this.bridges,
      solutionLength: this.solutionPath.length
    };
  }
}

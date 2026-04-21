import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dicom-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dicom-viewer-container">
      <div class="viewer-toolbar">
        <div class="toolbar-left">
          <span class="material-icons viewer-icon">biotech</span>
          <span class="viewer-title">DICOM Viewer</span>
        </div>
        <div class="toolbar-controls">
          <button class="tool-btn" [class.active]="activeTool === 'pan'" (click)="setTool('pan')" title="Перемещение">
            <span class="material-icons">pan_tool</span>
          </button>
          <button class="tool-btn" [class.active]="activeTool === 'zoom'" (click)="setTool('zoom')" title="Зум">
            <span class="material-icons">zoom_in</span>
          </button>
          <button class="tool-btn" [class.active]="activeTool === 'wwwc'" (click)="setTool('wwwc')" title="Яркость">
            <span class="material-icons">brightness_6</span>
          </button>
          <div class="toolbar-divider"></div>
          <button class="tool-btn measure" [class.active]="activeTool === 'length'" (click)="setTool('length')" title="Линейка">
            <span class="material-icons">straighten</span>
          </button>
          <button class="tool-btn measure" [class.active]="activeTool === 'angle'" (click)="setTool('angle')" title="Угол">
            <span class="material-icons">architecture</span>
          </button>
          <button class="tool-btn measure" [class.active]="activeTool === 'ellipse'" (click)="setTool('ellipse')" title="Эллипс">
            <span class="material-icons">radio_button_unchecked</span>
          </button>
          <div class="toolbar-divider"></div>
          <button class="tool-btn" (click)="clearAll()" title="Очистить измерения">
            <span class="material-icons">delete_sweep</span>
          </button>
          <button class="tool-btn" (click)="reset()" title="Сброс">
            <span class="material-icons">refresh</span>
          </button>
          <button class="tool-btn" (click)="toggleInvert()" [class.active]="inverted" title="Инверсия">
            <span class="material-icons">invert_colors</span>
          </button>
        </div>
      </div>

      <div class="viewer-main">
        <div class="upload-zone" *ngIf="!imageLoaded && !isLoading">
          <div class="upload-content">
            <span class="material-icons upload-icon">upload_file</span>
            <h3>Загрузить DICOM файл</h3>
            <p>Выберите .dcm файл или серию файлов</p>
            <label class="btn-upload" for="dcmInput">
              <span class="material-icons">folder_open</span>
              Выбрать файлы
            </label>
            <input id="dcmInput" type="file" accept=".dcm,.DCM" multiple (change)="onFiles($event)" style="position:fixed;left:-9999px">
            <button class="btn-demo" (click)="loadDemo()">
              <span class="material-icons">image</span>
              Демо снимок
            </button>
          </div>
        </div>

        <div class="loading-zone" *ngIf="isLoading">
          <div class="spinner"></div>
          <p>Загрузка...</p>
        </div>

        <div class="tool-badge" *ngIf="imageLoaded">
          <span class="material-icons">{{ getToolIcon() }}</span>
          {{ getToolName() }}
        </div>

        <div #viewerElement class="dicom-canvas" oncontextmenu="return false"></div>

        <div class="overlay-info" *ngIf="imageLoaded && imageInfo">
          <div class="info-block info-tl">
            <div>{{ imageInfo.patientName }}</div>
            <div style="color:#a78bfa">{{ imageInfo.modality }}</div>
          </div>
          <div class="info-block info-bl">
            <div *ngIf="totalSlices > 1" style="color:#a78bfa">Кадр: {{ currentSlice + 1 }}/{{ totalSlices }}</div>
          </div>
        </div>

        <div class="slice-nav" *ngIf="imageLoaded && totalSlices > 1">
          <button class="slice-btn" (click)="prevSlice()" [disabled]="currentSlice === 0">
            <span class="material-icons">chevron_left</span>
          </button>
          <input type="range" class="slice-slider" [min]="0" [max]="totalSlices - 1" [value]="currentSlice" (input)="onSliceSlider($event)">
          <button class="slice-btn" (click)="nextSlice()" [disabled]="currentSlice === totalSlices - 1">
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dicom-viewer.component.scss']
})
export class DicomViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() studyId = '';
  @ViewChild('viewerElement') viewerElement!: ElementRef;

  imageLoaded = false;
  isLoading = false;
  inverted = false;
  activeTool: 'pan' | 'zoom' | 'wwwc' | 'length' | 'angle' | 'ellipse' = 'wwwc';

  imageIds: string[] = [];
  currentSlice = 0;
  totalSlices = 0;
  imageInfo: any = null;

  private cs: any;
  private csTools: any;
  private csWADO: any;
  private dcmParser: any;
  private loaded = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}
  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    try {
      if (this.loaded && this.viewerElement?.nativeElement) {
        this.cs.disable(this.viewerElement.nativeElement);
      }
    } catch(e) {}
  }

  async loadLibraries(): Promise<void> {
    if (this.loaded) return;

    const scripts = [
      'https://unpkg.com/cornerstone-core@2.6.1/dist/cornerstone.min.js',
      'https://unpkg.com/dicom-parser@1.8.21/dist/dicomParser.min.js',
      'https://unpkg.com/hammerjs@2.0.8/hammer.min.js',
      'https://unpkg.com/cornerstone-math@0.1.10/dist/cornerstoneMath.min.js',
      'https://unpkg.com/cornerstone-tools@6.0.10/dist/cornerstoneTools.min.js',
      'https://unpkg.com/cornerstone-wado-image-loader@4.13.2/dist/cornerstoneWADOImageLoader.bundle.min.js'
    ];

    for (const src of scripts) {
      await this.loadScript(src);
    }

    await new Promise(r => setTimeout(r, 300));

    this.cs = (window as any).cornerstone;
    this.csTools = (window as any).cornerstoneTools;
    this.csWADO = (window as any).cornerstoneWADOImageLoader;
    this.dcmParser = (window as any).dicomParser;

    if (!this.cs || !this.csTools || !this.csWADO) {
      throw new Error('Libraries not loaded');
    }

    this.csWADO.external.cornerstone = this.cs;
    this.csWADO.external.dicomParser = this.dcmParser;
    this.csTools.external.cornerstone = this.cs;
    this.csTools.external.Hammer = (window as any).Hammer;
    this.csTools.external.cornerstoneMath = (window as any).cornerstoneMath;

    this.csTools.init({ showSVGCursors: true });

    this.csTools.addTool(this.csTools.PanTool);
    this.csTools.addTool(this.csTools.ZoomTool);
    this.csTools.addTool(this.csTools.WwwcTool);
    this.csTools.addTool(this.csTools.LengthTool);
    this.csTools.addTool(this.csTools.AngleTool);
    this.csTools.addTool(this.csTools.EllipticalRoiTool);
    this.csTools.addTool(this.csTools.StackScrollMouseWheelTool);

    this.loaded = true;
  }

  loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject();
      document.head.appendChild(s);
    });
  }

  async onFiles(event: any): Promise<void> {
    const files: File[] = Array.from(event.target.files || []);
    if (!files.length) return;

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      await this.loadLibraries();

      const element = this.viewerElement.nativeElement;
      this.cs.enable(element);

      this.imageIds = files.map((f: File) => this.csWADO.wadouri.fileManager.add(f));
      this.totalSlices = this.imageIds.length;
      this.currentSlice = 0;

      const image = await this.cs.loadAndCacheImage(this.imageIds[0]);
      this.cs.displayImage(element, image);

      const stack = {
        currentImageIdIndex: 0,
        imageIds: this.imageIds
      };
      this.csTools.addStackStateManager(element, ['stack']);
      this.csTools.addToolState(element, 'stack', stack);

      this.csTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
      this.csTools.setToolActive('StackScrollMouseWheel', {});

      this.extractInfo(image);
      this.isLoading = false;
      this.imageLoaded = true;
      this.activeTool = 'wwwc';
      this.cdr.detectChanges();
    } catch(e) {
      console.error('Load error:', e);
      this.isLoading = false;
      alert('Ошибка загрузки DICOM');
      this.cdr.detectChanges();
    }
  }

  async loadDemo(): Promise<void> {
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      await this.loadLibraries();
      const element = this.viewerElement.nativeElement;
      this.cs.enable(element);
      const imageId = 'wadouri:https://rawgit.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/CT_SMALL.dcm';
      const image = await this.cs.loadAndCacheImage(imageId);
      this.cs.displayImage(element, image);
      this.csTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
      this.imageInfo = { patientName: 'Demo', modality: 'CT' };
      this.isLoading = false;
      this.imageLoaded = true;
      this.totalSlices = 1;
      this.activeTool = 'wwwc';
      this.cdr.detectChanges();
    } catch(e) {
      console.error(e);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  extractInfo(image: any): void {
    try {
      const d = image.data;
      this.imageInfo = {
        patientName: d?.string('x00100010') || 'Anonymous',
        modality: d?.string('x00080060') || 'Unknown',
        studyDate: d?.string('x00080020') || ''
      };
    } catch(e) { this.imageInfo = {}; }
  }

  setTool(tool: string): void {
    if (!this.loaded) return;
    const map: any = { pan: 'Pan', zoom: 'Zoom', wwwc: 'Wwwc', length: 'Length', angle: 'Angle', ellipse: 'EllipticalRoi' };

    Object.values(map).forEach((n: any) => {
      try { this.csTools.setToolPassive(n); } catch(e) {}
    });

    const name = map[tool];
    if (name) {
      this.csTools.setToolActive(name, { mouseButtonMask: 1 });
      this.activeTool = tool as any;
    }
  }

  clearAll(): void {
    if (!this.loaded) return;
    const el = this.viewerElement.nativeElement;
    ['Length', 'Angle', 'EllipticalRoi'].forEach(t => {
      try { this.csTools.clearToolState(el, t); } catch(e) {}
    });
    this.cs.updateImage(el);
  }

  reset(): void {
    if (!this.loaded) return;
    this.cs.reset(this.viewerElement.nativeElement);
  }

  toggleInvert(): void {
    if (!this.loaded) return;
    const el = this.viewerElement.nativeElement;
    const vp = this.cs.getViewport(el);
    vp.invert = !vp.invert;
    this.inverted = vp.invert;
    this.cs.setViewport(el, vp);
  }

  nextSlice(): void { this.goToSlice(this.currentSlice + 1); }
  prevSlice(): void { this.goToSlice(this.currentSlice - 1); }
  onSliceSlider(e: any): void { this.goToSlice(+e.target.value); }

  async goToSlice(i: number): Promise<void> {
    if (i < 0 || i >= this.totalSlices) return;
    this.currentSlice = i;
    const el = this.viewerElement.nativeElement;
    const image = await this.cs.loadAndCacheImage(this.imageIds[i]);
    const vp = this.cs.getViewport(el);
    this.cs.displayImage(el, image);
    this.cs.setViewport(el, vp);
  }

  getToolIcon(): string {
    const m: any = { pan: 'pan_tool', zoom: 'zoom_in', wwwc: 'brightness_6', length: 'straighten', angle: 'architecture', ellipse: 'radio_button_unchecked' };
    return m[this.activeTool] || 'pan_tool';
  }

  getToolName(): string {
    const m: any = { pan: 'Перемещение', zoom: 'Зум', wwwc: 'Яркость/Контраст', length: 'Линейка', angle: 'Угол', ellipse: 'Эллипс ROI' };
    return m[this.activeTool] || '';
  }
}

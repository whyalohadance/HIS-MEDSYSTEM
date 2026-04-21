import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

declare let cornerstone: any;
declare let cornerstoneWADOImageLoader: any;
declare let dicomParser: any;

@Component({
  selector: 'app-dicom-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './dicom-viewer.component.html',
  styleUrls: ['./dicom-viewer.component.scss']
})
export class DicomViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() studyId: string = '';
  @ViewChild('dicomElement') dicomElement!: ElementRef;

  imageLoaded = false;
  isLoading = false;
  inverted = false;
  zoom = 1;
  brightness = 0;
  contrast = 1;
  windowWidth = 400;
  windowCenter = 40;
  imageInfo: any = null;

  // Multi-frame
  files: File[] = [];
  currentSlice = 0;
  totalSlices = 0;
  isMultiFrame = false;
  imageIds: string[] = [];

  // Active tool
  activeTool: 'pan' | 'length' = 'pan';

  // SVG measurements
  measurements: Array<{x1:number; y1:number; x2:number; y2:number; distance:string}> = [];
  isDrawing = false;
  drawStart: {x:number; y:number} | null = null;
  tempEnd: {x:number; y:number} | null = null;
  pixelSpacing: number | null = null;

  isDragOver = false;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private cornerstoneReady = false;
  private keyDownHandler!: (e: KeyboardEvent) => void;

  // Wheel accumulator
  private wheelAccumulator = 0;
  private readonly WHEEL_THRESHOLD = 80;

  // Drag-to-slice (middle mouse button)
  private isDraggingSlice = false;
  private dragStartX = 0;
  private dragStartSlice = 0;
  private readonly DRAG_SENSITIVITY = 8;

  // Touch
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartSlice = 0;
  private readonly TOUCH_SENSITIVITY = 6;

  constructor(private cdr: ChangeDetectorRef, private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadCornerstoneScripts();
  }

  ngAfterViewInit(): void {
    this.keyDownHandler = this.onKeyDown.bind(this);
    document.addEventListener('keydown', this.keyDownHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keyDownHandler);
    if (this.cornerstoneReady && this.dicomElement?.nativeElement) {
      try { cornerstone.disable(this.dicomElement.nativeElement); } catch (_) {}
    }
  }

  private loadCornerstoneScripts(): void {
    const scripts = [
      { src: 'https://unpkg.com/cornerstone-core@2.6.1/dist/cornerstone.js', id: 'cs-core' },
      { src: 'https://unpkg.com/dicom-parser@1.8.21/dist/dicomParser.js', id: 'cs-dicom-parser' },
      { src: 'https://unpkg.com/cornerstone-wado-image-loader@4.13.2/dist/cornerstoneWADOImageLoader.bundle.min.js', id: 'cs-wado' }
    ];

    const loadNext = (index: number) => {
      if (index >= scripts.length) {
        setTimeout(() => this.initCornerstone(), 300);
        return;
      }
      const { src, id } = scripts[index];
      if (document.getElementById(id)) { loadNext(index + 1); return; }
      const s = document.createElement('script');
      s.src = src;
      s.id = id;
      s.onload = () => loadNext(index + 1);
      s.onerror = () => loadNext(index + 1);
      document.head.appendChild(s);
    };

    loadNext(0);
  }

  private initCornerstone(): void {
    try {
      const cs = (window as any).cornerstone;
      const csWADO = (window as any).cornerstoneWADOImageLoader;
      const dcmParser = (window as any).dicomParser;

      if (!cs) { console.error('cornerstone not loaded'); return; }
      if (!csWADO) { console.error('cornerstoneWADOImageLoader not loaded'); return; }

      csWADO.external.cornerstone = cs;
      if (dcmParser) csWADO.external.dicomParser = dcmParser;

      this.cornerstoneReady = true;

      if (this.dicomElement?.nativeElement) {
        cs.enable(this.dicomElement.nativeElement);
      }

      console.log('Cornerstone initialized OK');
    } catch (e) {
      console.error('Cornerstone init error:', e);
    }
  }

  // ===== TOOL SELECTION =====
  setTool(tool: 'pan' | 'length'): void {
    this.activeTool = tool;
    if (tool === 'pan') {
      this.isDrawing = false;
      this.drawStart = null;
      this.tempEnd = null;
    }
  }

  // ===== SVG MEASUREMENTS =====
  startMeasure(event: MouseEvent): void {
    if (this.activeTool !== 'length' || !this.imageLoaded) return;
    event.preventDefault();
    event.stopPropagation();
    const svg = event.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    this.drawStart = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    this.tempEnd = { ...this.drawStart };
    this.isDrawing = true;
  }

  updateMeasure(event: MouseEvent): void {
    if (!this.isDrawing || !this.drawStart) return;
    const svg = event.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    this.tempEnd = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  endMeasure(): void {
    if (!this.isDrawing || !this.drawStart || !this.tempEnd) {
      this.isDrawing = false;
      return;
    }
    const dx = this.tempEnd.x - this.drawStart.x;
    const dy = this.tempEnd.y - this.drawStart.y;
    const pixels = Math.sqrt(dx * dx + dy * dy);

    if (pixels < 5) {
      this.isDrawing = false;
      this.drawStart = null;
      this.tempEnd = null;
      return;
    }

    let distance: string;
    if (this.pixelSpacing) {
      const mm = pixels * this.pixelSpacing;
      distance = mm < 10 ? `${mm.toFixed(1)} mm` : `${(mm / 10).toFixed(2)} cm`;
    } else {
      distance = `${pixels.toFixed(0)} px`;
    }

    this.measurements.push({
      x1: this.drawStart.x, y1: this.drawStart.y,
      x2: this.tempEnd.x,  y2: this.tempEnd.y,
      distance
    });
    this.isDrawing = false;
    this.drawStart = null;
    this.tempEnd = null;
  }

  clearMeasurements(): void {
    this.measurements = [];
  }

  // ===== DRAG / DROP =====
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    if (files.length === 1) {
      this.isMultiFrame = false;
      this.loadDicomFile(files[0]);
    } else {
      this.handleMultipleFiles(Array.from(files) as File[]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.isMultiFrame = false; this.loadDicomFile(file); }
    input.value = '';
  }

  onFilesSelected(event: any): void {
    const selectedFiles = Array.from(event.target.files) as File[];
    if (!selectedFiles.length) return;

    for (const file of selectedFiles) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 100) {
        alert(`Файл ${(file as File).name} слишком большой: ${sizeMB.toFixed(1)} MB. Максимум 100 MB.`);
        event.target.value = '';
        return;
      }
    }

    if (selectedFiles.length === 1) {
      this.loadDicomFile(selectedFiles[0] as File);
    } else {
      this.isMultiFrame = true;
      this.files = selectedFiles.sort((a, b) => (a as File).name.localeCompare((b as File).name)) as File[];
      this.totalSlices = this.files.length;
      this.currentSlice = 0;
      this.cdr.detectChanges();
      this.loadMultipleFiles(this.files);
    }
    event.target.value = '';
  }

  private handleMultipleFiles(selectedFiles: File[]): void {
    this.isMultiFrame = true;
    this.files = selectedFiles.sort((a, b) => a.name.localeCompare(b.name));
    this.totalSlices = this.files.length;
    this.currentSlice = 0;
    this.cdr.detectChanges();
    this.loadMultipleFiles(this.files);
  }

  loadMultipleFiles(files: File[]): void {
    if (!this.cornerstoneReady) { setTimeout(() => this.loadMultipleFiles(files), 800); return; }
    this.isLoading = true;
    this.imageLoaded = false;
    this.imageIds = [];
    this.measurements = [];
    this.cdr.detectChanges();

    if (this.dicomElement?.nativeElement) {
      try { cornerstone.enable(this.dicomElement.nativeElement); } catch (_) {}
    }

    this.imageIds = files.map(file =>
      cornerstoneWADOImageLoader.wadouri.fileManager.add(file)
    );

    cornerstone.loadImage(this.imageIds[0]).then((image: any) => {
      cornerstone.displayImage(this.dicomElement.nativeElement, image);
      const vp = cornerstone.getDefaultViewportForImage(this.dicomElement.nativeElement, image);
      cornerstone.setViewport(this.dicomElement.nativeElement, vp);
      this.windowWidth = vp?.voi?.windowWidth ?? 400;
      this.windowCenter = vp?.voi?.windowCenter ?? 40;
      this.extractMetadata(image);
      this.extractPixelSpacing(image);
      this.isLoading = false;
      this.imageLoaded = true;
      this.currentSlice = 0;
      this.zoom = 1;
      this.inverted = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
      alert(this.translate.instant('DICOM.LOAD_ERROR'));
    });
  }

  goToSlice(index: number): void {
    if (!this.imageLoaded) return;
    if (index < 0 || index >= this.totalSlices) return;
    if (index === this.currentSlice) return;

    this.currentSlice = index;
    this.cdr.detectChanges();

    if (this.isMultiFrame && this.imageIds.length > 1) {
      const imageId = this.imageIds[index];
      cornerstone.loadImage(imageId).then((image: any) => {
        if (!this.dicomElement?.nativeElement) return;
        try {
          const viewport = cornerstone.getViewport(this.dicomElement.nativeElement);
          cornerstone.displayImage(this.dicomElement.nativeElement, image);
          if (viewport) cornerstone.setViewport(this.dicomElement.nativeElement, viewport);
        } catch (_) {
          cornerstone.displayImage(this.dicomElement.nativeElement, image);
        }
      }).catch((err: any) => {
        console.warn('Frame load error:', err);
      });
    }
  }

  nextSlice(): void { this.goToSlice(this.currentSlice + 1); }
  prevSlice(): void { this.goToSlice(this.currentSlice - 1); }

  onSliceSlider(event: any): void {
    this.goToSlice(Number(event.target.value));
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.imageLoaded || !this.isMultiFrame) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextSlice();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevSlice();
    }
  }

  loadDicomFile(file: File): void {
    if (!this.cornerstoneReady) { setTimeout(() => this.loadDicomFile(file), 800); return; }
    this.isLoading = true;
    this.imageLoaded = false;
    this.isMultiFrame = false;
    this.measurements = [];
    this.cdr.detectChanges();

    if (this.dicomElement?.nativeElement) {
      try { cornerstone.enable(this.dicomElement.nativeElement); } catch (_) {}
    }

    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);

    cornerstone.loadImage(imageId).then((image: any) => {
      cornerstone.displayImage(this.dicomElement.nativeElement, image);
      const vp = cornerstone.getDefaultViewportForImage(this.dicomElement.nativeElement, image);
      cornerstone.setViewport(this.dicomElement.nativeElement, vp);
      this.windowWidth = vp?.voi?.windowWidth ?? 400;
      this.windowCenter = vp?.voi?.windowCenter ?? 40;

      try {
        const dataSet = image.data;
        const numberOfFrames = dataSet?.intString('x00280008');
        if (numberOfFrames && numberOfFrames > 1) {
          this.isMultiFrame = true;
          this.totalSlices = numberOfFrames;
          this.currentSlice = 0;
          this.imageIds = Array.from(
            { length: numberOfFrames },
            (_, i) => `${imageId}?frame=${i}`
          );
        } else {
          this.isMultiFrame = false;
          this.totalSlices = 1;
          this.imageIds = [imageId];
        }
      } catch (e) {
        this.isMultiFrame = false;
        this.totalSlices = 1;
      }

      this.extractMetadata(image);
      this.extractPixelSpacing(image);

      this.isLoading = false;
      this.imageLoaded = true;
      this.zoom = 1;
      this.inverted = false;
      this.cdr.detectChanges();
    }).catch((err: any) => {
      console.error('DICOM load error:', err);
      this.isLoading = false;
      this.cdr.detectChanges();
      alert(this.translate.instant('DICOM.LOAD_ERROR'));
    });
  }

  loadDemoImage(): void {
    if (!this.cornerstoneReady) { setTimeout(() => this.loadDemoImage(), 800); return; }
    this.isLoading = true;
    this.imageLoaded = false;
    this.isMultiFrame = false;
    this.measurements = [];
    this.cdr.detectChanges();

    if (this.dicomElement?.nativeElement) {
      try { cornerstone.enable(this.dicomElement.nativeElement); } catch (_) {}
    }

    const imageId = 'wadouri:https://rawgit.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/CT_SMALL.dcm';

    cornerstone.loadAndCacheImage(imageId).then((image: any) => {
      cornerstone.displayImage(this.dicomElement.nativeElement, image);
      this.imageInfo = { patientName: 'Demo Patient', modality: 'CT', studyDate: '2026-04-21', institution: 'HIS-MedSystem Demo' };
      this.pixelSpacing = null;
      this.isLoading = false;
      this.imageLoaded = true;
      this.zoom = 1;
      this.cdr.detectChanges();
    }).catch((err: any) => {
      console.error('Demo DICOM load error:', err);
      this.isLoading = false;
      this.cdr.detectChanges();
      alert(this.translate.instant('DICOM.LOAD_ERROR'));
    });
  }

  private extractMetadata(image: any): void {
    try {
      const ds = image.data;
      this.imageInfo = {
        patientName: ds?.string('x00100010') || 'Anonymous',
        studyDate:   ds?.string('x00080020') || '',
        modality:    ds?.string('x00080060') || '',
        institution: ds?.string('x00080080') || '',
        frames: this.totalSlices
      };
    } catch (_) {
      this.imageInfo = {};
    }
  }

  private extractPixelSpacing(image: any): void {
    try {
      const ps = image.data?.string('x00280030');
      if (ps) {
        this.pixelSpacing = parseFloat(ps.split('\\')[0]);
      } else {
        this.pixelSpacing = null;
      }
    } catch (e) {
      this.pixelSpacing = null;
    }
  }

  // ===== VIEWPORT =====
  applyZoom(): void {
    if (!this.imageLoaded || !this.dicomElement?.nativeElement) return;
    try {
      const vp = cornerstone.getViewport(this.dicomElement.nativeElement);
      vp.scale = this.zoom;
      cornerstone.setViewport(this.dicomElement.nativeElement, vp);
    } catch (_) {}
  }

  applyViewport(): void {
    if (!this.imageLoaded || !this.dicomElement?.nativeElement) return;
    try {
      const vp = cornerstone.getViewport(this.dicomElement.nativeElement);
      vp.voi.windowWidth  = this.windowWidth  + this.brightness * 10;
      vp.voi.windowCenter = this.windowCenter + this.brightness * 5;
      cornerstone.setViewport(this.dicomElement.nativeElement, vp);
    } catch (_) {}
  }

  resetViewport(): void {
    if (!this.imageLoaded || !this.dicomElement?.nativeElement) return;
    try {
      this.zoom = 1; this.brightness = 0; this.contrast = 1; this.inverted = false;
      cornerstone.reset(this.dicomElement.nativeElement);
    } catch (_) {}
  }

  invertImage(): void {
    if (!this.imageLoaded || !this.dicomElement?.nativeElement) return;
    try {
      const vp = cornerstone.getViewport(this.dicomElement.nativeElement);
      vp.invert = !vp.invert;
      this.inverted = vp.invert;
      cornerstone.setViewport(this.dicomElement.nativeElement, vp);
    } catch (_) {}
  }

  toggleFullscreen(): void {
    const container = this.dicomElement?.nativeElement?.closest('.dicom-viewer-container');
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // ===== MOUSE EVENTS (pan + W/L) =====
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (!this.imageLoaded) return;

    if (event.ctrlKey) {
      this.wheelAccumulator = 0;
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      this.zoom = Math.max(0.1, Math.min(5, Math.round((this.zoom + delta) * 10) / 10));
      this.applyZoom();
      return;
    }

    if (this.isMultiFrame && this.totalSlices > 1) {
      this.wheelAccumulator += event.deltaY;
      const steps = Math.floor(Math.abs(this.wheelAccumulator) / this.WHEEL_THRESHOLD);
      if (steps > 0) {
        const direction = this.wheelAccumulator > 0 ? 1 : -1;
        const jump = Math.min(steps, 5);
        this.goToSlice(this.currentSlice + direction * jump);
        this.wheelAccumulator -= direction * steps * this.WHEEL_THRESHOLD;
      }
    } else {
      this.wheelAccumulator = 0;
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      this.zoom = Math.max(0.1, Math.min(5, Math.round((this.zoom + delta) * 10) / 10));
      this.applyZoom();
    }
  }

  onMouseDown(event: MouseEvent): void {
    // SVG overlay handles length tool — ignore here
    if (this.activeTool === 'length') return;

    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    if (this.isMultiFrame && this.totalSlices > 1 && event.button === 1) {
      this.isDraggingSlice = true;
      this.dragStartX = event.clientX;
      this.dragStartSlice = this.currentSlice;
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.imageLoaded || this.activeTool === 'length') return;

    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    try {
      if (this.isDraggingSlice && this.isMultiFrame) {
        const totalDeltaX = event.clientX - this.dragStartX;
        const sliceOffset = Math.round(totalDeltaX / this.DRAG_SENSITIVITY);
        const targetSlice = Math.max(0, Math.min(
          this.totalSlices - 1,
          this.dragStartSlice - sliceOffset
        ));
        if (targetSlice !== this.currentSlice) {
          this.goToSlice(targetSlice);
        }
        return;
      }

      if (event.buttons === 1) {
        const viewport = cornerstone.getViewport(this.dicomElement.nativeElement);
        viewport.translation.x += deltaX;
        viewport.translation.y += deltaY;
        cornerstone.setViewport(this.dicomElement.nativeElement, viewport);
      } else if (event.buttons === 2) {
        const viewport = cornerstone.getViewport(this.dicomElement.nativeElement);
        viewport.voi.windowWidth  += deltaX * 2;
        viewport.voi.windowCenter += deltaY * 2;
        this.windowWidth  = Math.round(viewport.voi.windowWidth);
        this.windowCenter = Math.round(viewport.voi.windowCenter);
        cornerstone.setViewport(this.dicomElement.nativeElement, viewport);
      }
    } catch (_) {}
  }

  onMouseUp(event?: MouseEvent): void {
    this.isDragging = false;
    this.isDraggingSlice = false;
  }

  onTouchStart(event: TouchEvent): void {
    if (!this.imageLoaded) return;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchStartSlice = this.currentSlice;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.imageLoaded) return;
    event.preventDefault();

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const deltaX = currentX - this.touchStartX;
    const deltaY = currentY - this.touchStartY;

    if (this.isMultiFrame && this.totalSlices > 1) {
      const dominantDelta = Math.abs(deltaY) >= Math.abs(deltaX) ? -deltaY : -deltaX;
      const sliceOffset = Math.round(dominantDelta / this.TOUCH_SENSITIVITY);
      const targetSlice = Math.max(0, Math.min(
        this.totalSlices - 1,
        this.touchStartSlice + sliceOffset
      ));
      if (targetSlice !== this.currentSlice) {
        this.goToSlice(targetSlice);
      }
    } else {
      try {
        const viewport = cornerstone.getViewport(this.dicomElement.nativeElement);
        viewport.translation.x += deltaX * 0.5;
        viewport.translation.y += deltaY * 0.5;
        cornerstone.setViewport(this.dicomElement.nativeElement, viewport);
        this.touchStartX = currentX;
        this.touchStartY = currentY;
      } catch (_) {}
    }
  }

  onTouchEnd(): void {
    this.touchStartSlice = this.currentSlice;
  }
}

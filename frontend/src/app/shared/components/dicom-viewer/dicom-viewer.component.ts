import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';

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
  @Input() studyNumericId: number | null = null;
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
  activeTool: 'pan' | 'length' | 'annotation' = 'pan';

  // SVG measurements
  measurements: Array<{id?: number; x1:number; y1:number; x2:number; y2:number; distance:string; sliceIndex?: number}> = [];
  isDrawing = false;
  drawStart: {x:number; y:number} | null = null;
  tempEnd: {x:number; y:number} | null = null;
  pixelSpacing: number | null = null;

  // Annotations
  annotations: Array<{id?: number; x:number; y:number; labelX:number; labelY:number; text:string; color:string}> = [];
  isAddingAnnotation = false;
  editingAnnotationIndex = -1;
  annotationText = '';
  showAnnotationInput = false;
  annotationInputX = 0;
  annotationInputY = 0;
  pendingAnnotation: {x:number; y:number} | null = null;

  isDragOver = false;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private cornerstoneReady = false;
  private keyDownHandler!: (e: KeyboardEvent) => void;

  // Wheel accumulator
  private wheelAccumulator = 0;
  private readonly WHEEL_THRESHOLD = 80;

  // Drag-to-slice
  private isDraggingSlice = false;
  private dragStartX = 0;
  private dragStartSlice = 0;
  private readonly DRAG_SENSITIVITY = 8;

  // Touch
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartSlice = 0;
  private readonly TOUCH_SENSITIVITY = 6;

  constructor(
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private api: ApiService
  ) {}

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
      s.src = src; s.id = id;
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
      if (!cs || !csWADO) { console.error('Cornerstone not loaded'); return; }
      csWADO.external.cornerstone = cs;
      if (dcmParser) csWADO.external.dicomParser = dcmParser;
      this.cornerstoneReady = true;
      if (this.dicomElement?.nativeElement) cs.enable(this.dicomElement.nativeElement);
    } catch (e) {
      console.error('Cornerstone init error:', e);
    }
  }

  // ===== TOOL SELECTION =====
  setTool(tool: 'pan' | 'length' | 'annotation'): void {
    this.activeTool = tool;
    this.isDrawing = false;
    this.drawStart = null;
    this.tempEnd = null;
    this.showAnnotationInput = false;
    this.pendingAnnotation = null;
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

    const measurement = {
      x1: this.drawStart.x, y1: this.drawStart.y,
      x2: this.tempEnd.x,   y2: this.tempEnd.y,
      distance, sliceIndex: this.currentSlice
    };

    this.measurements.push(measurement);

    if (this.studyNumericId) {
      this.api.post<any>(`/studies/${this.studyNumericId}/measurements`, {
        type: 'length', ...measurement
      }).subscribe({
        next: (res) => {
          const idx = this.measurements.length - 1;
          if (res.data?.id && this.measurements[idx]) {
            this.measurements[idx].id = res.data.id;
          }
        },
        error: () => console.warn('Не удалось сохранить измерение в БД')
      });
    }

    this.isDrawing = false;
    this.drawStart = null;
    this.tempEnd = null;
  }

  clearMeasurements(): void {
    if (this.studyNumericId) {
      this.api.delete(`/studies/${this.studyNumericId}/measurements`).subscribe();
      this.api.delete(`/studies/${this.studyNumericId}/annotations`).subscribe();
    }
    this.measurements = [];
    this.annotations = [];
  }

  // ===== ANNOTATIONS =====
  startAnnotation(event: MouseEvent): void {
    if (this.activeTool !== 'annotation' || !this.imageLoaded) return;
    event.preventDefault();
    event.stopPropagation();
    const svg = event.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.pendingAnnotation = { x, y };
    this.annotationInputX = Math.min(x, rect.width - 260);
    this.annotationInputY = y + 20;
    this.annotationText = '';
    this.showAnnotationInput = true;
    setTimeout(() => {
      const input = document.getElementById('annotationInput') as HTMLInputElement;
      if (input) input.focus();
    }, 50);
  }

  saveAnnotation(): void {
    if (!this.pendingAnnotation || !this.annotationText.trim()) {
      this.cancelAnnotation();
      return;
    }

    const annotation = {
      x: this.pendingAnnotation.x,
      y: this.pendingAnnotation.y,
      labelX: this.pendingAnnotation.x + 40,
      labelY: this.pendingAnnotation.y - 30,
      text: this.annotationText.trim(),
      color: '#ef4444'
    };

    this.annotations.push(annotation);

    if (this.studyNumericId) {
      this.api.post<any>(`/studies/${this.studyNumericId}/annotations`, {
        ...annotation,
        sliceIndex: this.currentSlice
      }).subscribe({
        next: (res) => {
          if (res.data?.id) {
            const idx = this.annotations.length - 1;
            if (this.annotations[idx]) this.annotations[idx].id = res.data.id;
          }
        },
        error: () => console.warn('Не удалось сохранить аннотацию')
      });
    }

    this.cancelAnnotation();
  }

  cancelAnnotation(): void {
    this.pendingAnnotation = null;
    this.showAnnotationInput = false;
    this.annotationText = '';
  }

  deleteAnnotation(index: number): void {
    const a = this.annotations[index];
    if (a.id && this.studyNumericId) {
      this.api.delete(`/studies/annotations/${a.id}`).subscribe();
    }
    this.annotations.splice(index, 1);
  }

  onAnnotationKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Enter') this.saveAnnotation();
    else if (event.key === 'Escape') this.cancelAnnotation();
  }

  clearAllAnnotations(): void {
    if (this.studyNumericId) {
      this.api.delete(`/studies/${this.studyNumericId}/annotations`).subscribe();
    }
    this.annotations = [];
  }

  // ===== LOAD MEASUREMENTS + ANNOTATIONS =====
  loadMeasurements(): void {
    if (!this.studyNumericId) return;

    this.api.get<any>(`/studies/${this.studyNumericId}/measurements`).subscribe({
      next: (res) => {
        this.measurements = (res.data || []).map((m: any) => ({
          id: m.id, x1: m.x1, y1: m.y1, x2: m.x2, y2: m.y2,
          distance: m.distance, sliceIndex: m.sliceIndex
        }));
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.api.get<any>(`/studies/${this.studyNumericId}/annotations`).subscribe({
      next: (res) => {
        this.annotations = (res.data || []).map((a: any) => ({
          id: a.id, x: a.x, y: a.y,
          labelX: a.labelX ?? (a.x + 40),
          labelY: a.labelY ?? (a.y - 30),
          text: a.text, color: a.color || '#ef4444'
        }));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  // ===== EXPORT SNAPSHOT =====
  exportSnapshot(): void {
    if (!this.imageLoaded || !this.dicomElement?.nativeElement) return;
    const canvas = this.dicomElement.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) { alert('Canvas не найден'); return; }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    const rect = this.dicomElement.nativeElement.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Измерения
    ctx.lineWidth = 2;
    ctx.font = '14px monospace';
    this.measurements.forEach(m => {
      const x1 = m.x1 * scaleX, y1 = m.y1 * scaleY;
      const x2 = m.x2 * scaleX, y2 = m.y2 * scaleY;
      const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;

      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(x1, y1, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x2, y2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(midX - 40, midY - 14, 80, 24);
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(m.distance, midX, midY + 4);
    });

    // Аннотации
    this.annotations.forEach((a, i) => {
      const x = a.x * scaleX, y = a.y * scaleY;
      const lx = a.labelX * scaleX, ly = a.labelY * scaleY;

      ctx.fillStyle = a.color;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lx, ly); ctx.stroke();

      ctx.font = '14px monospace';
      const textWidth = ctx.measureText(a.text).width;
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(lx - 4, ly - 14, textWidth + 12, 24);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lx - 4, ly - 14, textWidth + 12, 24);
      ctx.fillStyle = a.color;
      ctx.textAlign = 'left';
      ctx.fillText(a.text, lx + 2, ly + 2);

      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText(String(i + 1), x, y + 4);
      ctx.font = '14px monospace';
    });

    // Пациент — левый верхний угол
    if (this.imageInfo) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(10, 10, 260, 68);
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'left';
      ctx.font = '12px monospace';
      ctx.fillText(`Patient: ${this.imageInfo.patientName || ''}`, 18, 30);
      ctx.fillText(`Modality: ${this.imageInfo.modality || ''}`, 18, 48);
      ctx.fillText(`Study: ${this.studyId || ''}`, 18, 66);
    }

    // Штамп
    const now = new Date().toISOString().split('T')[0];
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(canvas.width - 210, canvas.height - 30, 200, 24);
    ctx.fillStyle = '#6ee7b7';
    ctx.textAlign = 'left';
    ctx.font = '12px monospace';
    ctx.fillText(`HIS-MedSystem · ${now}`, canvas.width - 202, canvas.height - 12);

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DICOM_${this.studyId || 'snapshot'}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // ===== DRAG / DROP =====
  onDragOver(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation(); this.isDragOver = true;
  }
  onDragLeave(event: DragEvent): void { this.isDragOver = false; }

  onDrop(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation(); this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    if (files.length === 1) { this.isMultiFrame = false; this.loadDicomFile(files[0]); }
    else { this.handleMultipleFiles(Array.from(files) as File[]); }
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
        alert(`Файл ${(file as File).name} слишком большой: ${sizeMB.toFixed(1)} MB.`);
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
    this.annotations = [];
    this.cdr.detectChanges();

    if (this.dicomElement?.nativeElement) {
      try { cornerstone.enable(this.dicomElement.nativeElement); } catch (_) {}
    }

    this.imageIds = files.map(file => cornerstoneWADOImageLoader.wadouri.fileManager.add(file));

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
      this.loadMeasurements();
    }).catch(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
      alert(this.translate.instant('DICOM.LOAD_ERROR'));
    });
  }

  goToSlice(index: number): void {
    if (!this.imageLoaded || index < 0 || index >= this.totalSlices || index === this.currentSlice) return;
    this.currentSlice = index;
    this.cdr.detectChanges();
    if (this.isMultiFrame && this.imageIds.length > 1) {
      cornerstone.loadImage(this.imageIds[index]).then((image: any) => {
        if (!this.dicomElement?.nativeElement) return;
        try {
          const viewport = cornerstone.getViewport(this.dicomElement.nativeElement);
          cornerstone.displayImage(this.dicomElement.nativeElement, image);
          if (viewport) cornerstone.setViewport(this.dicomElement.nativeElement, viewport);
        } catch (_) { cornerstone.displayImage(this.dicomElement.nativeElement, image); }
      }).catch((err: any) => console.warn('Frame load error:', err));
    }
  }

  nextSlice(): void { this.goToSlice(this.currentSlice + 1); }
  prevSlice(): void { this.goToSlice(this.currentSlice - 1); }
  onSliceSlider(event: any): void { this.goToSlice(Number(event.target.value)); }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.imageLoaded || !this.isMultiFrame) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); this.nextSlice(); }
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); this.prevSlice(); }
  }

  loadDicomFile(file: File): void {
    if (!this.cornerstoneReady) { setTimeout(() => this.loadDicomFile(file), 800); return; }
    this.isLoading = true;
    this.imageLoaded = false;
    this.isMultiFrame = false;
    this.measurements = [];
    this.annotations = [];
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
          this.imageIds = Array.from({ length: numberOfFrames }, (_, i) => `${imageId}?frame=${i}`);
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
      this.loadMeasurements();
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
    this.annotations = [];
    this.cdr.detectChanges();

    if (this.dicomElement?.nativeElement) {
      try { cornerstone.enable(this.dicomElement.nativeElement); } catch (_) {}
    }

    const imageId = 'wadouri:https://rawgit.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/CT_SMALL.dcm';
    cornerstone.loadAndCacheImage(imageId).then((image: any) => {
      cornerstone.displayImage(this.dicomElement.nativeElement, image);
      this.imageInfo = { patientName: 'Demo Patient', modality: 'CT', studyDate: '2026-04-22', institution: 'HIS-MedSystem Demo' };
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
    } catch (_) { this.imageInfo = {}; }
  }

  private extractPixelSpacing(image: any): void {
    try {
      const ps = image.data?.string('x00280030');
      this.pixelSpacing = ps ? parseFloat(ps.split('\\')[0]) : null;
    } catch (e) { this.pixelSpacing = null; }
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
    if (!document.fullscreenElement) container.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  // ===== MOUSE EVENTS =====
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
        this.goToSlice(this.currentSlice + direction * Math.min(steps, 5));
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
    if (this.activeTool !== 'pan') return;
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
    if (!this.isDragging || !this.imageLoaded || this.activeTool !== 'pan') return;
    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    try {
      if (this.isDraggingSlice && this.isMultiFrame) {
        const totalDeltaX = event.clientX - this.dragStartX;
        const sliceOffset = Math.round(totalDeltaX / this.DRAG_SENSITIVITY);
        const targetSlice = Math.max(0, Math.min(this.totalSlices - 1, this.dragStartSlice - sliceOffset));
        if (targetSlice !== this.currentSlice) this.goToSlice(targetSlice);
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

  onMouseUp(): void {
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
      const targetSlice = Math.max(0, Math.min(this.totalSlices - 1, this.touchStartSlice + sliceOffset));
      if (targetSlice !== this.currentSlice) this.goToSlice(targetSlice);
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

  onTouchEnd(): void { this.touchStartSlice = this.currentSlice; }
}

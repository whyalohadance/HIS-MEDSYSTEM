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
    this.loadScripts();
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

  private loadScripts(): void {
    const scripts = [
      'https://unpkg.com/cornerstone-core@2.6.1/dist/cornerstone.js',
      'https://unpkg.com/dicom-parser@1.8.21/dist/dicomParser.js',
      'https://unpkg.com/cornerstone-wado-image-loader@4.13.2/dist/cornerstoneWADOImageLoader.bundle.min.js'
    ];

    let loaded = 0;
    const total = scripts.length;

    const tryInit = () => {
      loaded++;
      if (loaded === total) setTimeout(() => this.initCornerstone(), 400);
    };

    scripts.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) { tryInit(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = tryInit;
      s.onerror = tryInit;
      document.head.appendChild(s);
    });
  }

  private initCornerstone(): void {
    try {
      if (typeof cornerstone === 'undefined' || typeof cornerstoneWADOImageLoader === 'undefined') return;
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
      if (typeof dicomParser !== 'undefined') {
        cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
      }
      this.cornerstoneReady = true;
      if (this.dicomElement?.nativeElement) {
        cornerstone.enable(this.dicomElement.nativeElement);
      }
    } catch (e) {
      console.error('Cornerstone init error:', e);
    }
  }

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
        alert(`Файл ${file.name} слишком большой: ${sizeMB.toFixed(1)} MB. Максимум 100 MB.`);
        event.target.value = '';
        return;
      }
    }

    if (selectedFiles.length === 1) {
      // Один файл — может быть multi-frame внутри
      this.loadDicomFile(selectedFiles[0]);
    } else {
      // Несколько файлов — серия
      this.isMultiFrame = true;
      this.files = selectedFiles.sort((a, b) => a.name.localeCompare(b.name));
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

    this.currentSlice = index;
    this.cdr.detectChanges();

    if (this.isMultiFrame && this.imageIds.length > 1) {
      cornerstone.loadImage(this.imageIds[index]).then((image: any) => {
        const viewport = cornerstone.getViewport(this.dicomElement.nativeElement);
        cornerstone.displayImage(this.dicomElement.nativeElement, image);
        if (viewport) cornerstone.setViewport(this.dicomElement.nativeElement, viewport);
      }).catch((err: any) => {
        console.error('Frame load error:', err);
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

      // Проверяем количество кадров в файле
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

      // Метаданные
      try {
        const dataSet = image.data;
        this.imageInfo = {
          patientName: dataSet?.string('x00100010') || 'Anonymous',
          studyDate:   dataSet?.string('x00080020') || '',
          modality:    dataSet?.string('x00080060') || '',
          institution: dataSet?.string('x00080080') || '',
          frames: this.totalSlices
        };
      } catch (e) { this.imageInfo = {}; }

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
    this.cdr.detectChanges();

    if (this.dicomElement?.nativeElement) {
      try { cornerstone.enable(this.dicomElement.nativeElement); } catch (_) {}
    }

    const imageId = 'wadouri:https://rawgit.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/CT_SMALL.dcm';

    cornerstone.loadAndCacheImage(imageId).then((image: any) => {
      cornerstone.displayImage(this.dicomElement.nativeElement, image);
      this.imageInfo = { patientName: 'Demo Patient', modality: 'CT', studyDate: '2026-04-13', institution: 'HIS-MedSystem Demo' };
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
        institution: ds?.string('x00080080') || ''
      };
    } catch (_) {
      this.imageInfo = {};
    }
  }

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

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (!this.imageLoaded) return;

    if (this.isMultiFrame && this.totalSlices > 1) {
      // Накапливаем delta для плавности
      this.wheelAccumulator += event.deltaY;

      const steps = Math.floor(Math.abs(this.wheelAccumulator) / this.WHEEL_THRESHOLD);
      if (steps > 0) {
        const direction = this.wheelAccumulator > 0 ? 1 : -1;
        const jump = Math.min(steps, 5);
        this.goToSlice(this.currentSlice + direction * jump);
        this.wheelAccumulator -= direction * steps * this.WHEEL_THRESHOLD;
      }
    } else {
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      this.zoom = Math.max(0.1, Math.min(5, this.zoom + delta));
      this.zoom = Math.round(this.zoom * 10) / 10;
      this.applyZoom();
    }
  }

  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    if (this.isMultiFrame && this.totalSlices > 1 && event.button === 1) {
      // Средняя кнопка мыши — drag по срезам
      this.isDraggingSlice = true;
      this.dragStartX = event.clientX;
      this.dragStartSlice = this.currentSlice;
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.imageLoaded) return;

    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    try {
      if (this.isDraggingSlice && this.isMultiFrame) {
        // Drag средней кнопкой — листание срезов
        const totalDeltaX = event.clientX - this.dragStartX;
        const sliceOffset = Math.round(totalDeltaX / this.DRAG_SENSITIVITY);
        const targetSlice = Math.max(0, Math.min(
          this.totalSlices - 1,
          this.dragStartSlice - sliceOffset
        ));
        if (targetSlice !== this.currentSlice) {
          this.goToSlice(targetSlice);
        }
      } else if (event.buttons === 1 && !this.isDraggingSlice) {
        // Левая кнопка — перемещение снимка
        const viewport = cornerstone.getViewport(this.dicomElement.nativeElement);
        viewport.translation.x += deltaX;
        viewport.translation.y += deltaY;
        cornerstone.setViewport(this.dicomElement.nativeElement, viewport);
      } else if (event.buttons === 2) {
        // Правая кнопка — яркость/контраст
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
      // Вертикальный и горизонтальный свайп — листание срезов
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
      // Перемещение снимка
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

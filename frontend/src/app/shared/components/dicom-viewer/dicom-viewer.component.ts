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

  isDragOver = false;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private cornerstoneReady = false;

  constructor(private cdr: ChangeDetectorRef, private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadScripts();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
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
    if (files && files.length > 0) {
      this.loadDicomFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.loadDicomFile(file);
    input.value = '';
  }

  loadDicomFile(file: File): void {
    if (!this.cornerstoneReady) { setTimeout(() => this.loadDicomFile(file), 800); return; }
    this.isLoading = true;
    this.imageLoaded = false;
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
      this.extractMetadata(image);
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
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this.zoom = Math.round(Math.max(0.1, Math.min(5, this.zoom + delta)) * 10) / 10;
    this.applyZoom();
  }

  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.imageLoaded || !this.dicomElement?.nativeElement) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    try {
      const vp = cornerstone.getViewport(this.dicomElement.nativeElement);
      if (event.buttons === 1) {
        vp.translation.x += dx;
        vp.translation.y += dy;
      } else if (event.buttons === 2) {
        vp.voi.windowWidth  += dx * 2;
        vp.voi.windowCenter += dy * 2;
        this.windowWidth  = Math.round(vp.voi.windowWidth);
        this.windowCenter = Math.round(vp.voi.windowCenter);
      }
      cornerstone.setViewport(this.dicomElement.nativeElement, vp);
    } catch (_) {}
  }

  onMouseUp(): void {
    this.isDragging = false;
  }
}

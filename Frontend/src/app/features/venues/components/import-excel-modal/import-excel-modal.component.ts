import { Component, EventEmitter, Output } from '@angular/core';
import { read, utils, write } from 'xlsx';
import { ExcelVenueRow } from '../../../../shared/models/venue.model';
import { VenueService } from '../../../../core/services/venue.service';

@Component({
  selector: 'app-import-excel-modal-venue',
  templateUrl: './import-excel-modal.component.html',
  styleUrls: ['./import-excel-modal.component.css']
})
export class ImportExcelModalVenueComponent {
  constructor(private venueService: VenueService) {}
  
  @Output() close = new EventEmitter<void>();
  @Output() importSuccess = new EventEmitter<{ success: number; total: number; errors: string[] }>();

  selectedFile: File | null = null;
  fileName = '';
  fileSize = 0;
  isDragging = false;
  importing = false;
  previewData: ExcelVenueRow[] = [];
  showPreview = false;
  error = '';

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (this.isValidFileType(file)) {
        this.handleFile(file);
      } else {
        this.error = 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)';
      }
    }
  }

  private isValidFileType(file: File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return validTypes.includes(file.type) || 
           file.name.endsWith('.xlsx') || 
           file.name.endsWith('.xls');
  }

  private handleFile(file: File): void {
    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = file.size;
    this.error = '';
    this.previewData = [];
    this.showPreview = false;
    this.previewExcel(file);
  }

  private previewExcel(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: ExcelVenueRow[] = utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          this.error = 'Le fichier Excel est vide ou ne contient pas de données.';
          return;
        }

        this.previewData = jsonData.slice(0, 5);
        this.showPreview = true;
      } catch (error) {
        this.error = 'Erreur lors de la lecture du fichier Excel. Vérifiez le format du fichier.';
      }
    };

    reader.onerror = () => {
      this.error = 'Erreur lors de la lecture du fichier.';
    };

    reader.readAsBinaryString(file);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('excel-file-input-modal-venue') as HTMLInputElement;
    fileInput?.click();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.fileSize = 0;
    this.previewData = [];
    this.showPreview = false;
    this.error = '';
  }

  onImport(): void {
    if (!this.selectedFile) {
      this.error = 'Veuillez sélectionner un fichier Excel.';
      return;
    }

    this.importing = true;
    this.error = '';

    this.venueService.importFromExcel(this.selectedFile).subscribe({
      next: (result) => {
        this.importing = false;
        this.importSuccess.emit(result);
      },
      error: (error) => {
        this.importing = false;
        this.error = error.error?.message || 'Erreur lors de l\'importation du fichier Excel.';
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  downloadTemplate(): void {
    
    const headers = [
      'Nom',
      'Capacité',
      'Ville',
      'Adresse'
    ];

    const exampleData = [
      {
        'Nom': 'Zénith de Paris',
        'Capacité': 6000,
        'Ville': 'Paris',
        'Adresse': '211 Avenue Jean Jaurès, 75019 Paris'
      },
      {
        'Nom': 'Olympia',
        'Capacité': 2000,
        'Ville': 'Paris',
        'Adresse': '28 Boulevard des Capucines, 75009 Paris'
      },
      {
        'Nom': 'Accor Arena',
        'Capacité': 20000,
        'Ville': 'Paris',
        'Adresse': '8 Boulevard de Bercy, 75012 Paris'
      }
    ];

    const worksheet = utils.json_to_sheet([], { header: headers });

    utils.sheet_add_json(worksheet, exampleData, { 
      header: headers, 
      skipHeader: true,
      origin: 'A2' 
    });

    const columnWidths = [
      { wch: 25 }, 
      { wch: 12 }, 
      { wch: 15 }, 
      { wch: 40 }  
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Salles');

    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Modele_Import_Salles.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private getStringValue(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private getNumberValue(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = typeof value === 'number' ? value : parseInt(String(value), 10);
    return isNaN(num) ? undefined : num;
  }
}


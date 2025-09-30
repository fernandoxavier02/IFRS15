import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../components/confirmation-dialog/confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Opens a confirmation dialog
   * @param data Configuration for the dialog
   * @returns Observable<boolean> - true if confirmed, false if cancelled
   */
  confirm(data: ConfirmationDialogData): Observable<boolean> {
    const dialogRef: MatDialogRef<ConfirmationDialogComponent> = this.dialog.open(
      ConfirmationDialogComponent,
      {
        width: '400px',
        maxWidth: '90vw',
        data,
        disableClose: false,
        autoFocus: true
      }
    );

    return dialogRef.afterClosed();
  }

  /**
   * Quick confirmation for delete actions
   */
  confirmDelete(itemName: string, details?: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir "${itemName}"?`,
      details: details || 'Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete'
    });
  }

  /**
   * Quick confirmation for save actions
   */
  confirmSave(message?: string): Observable<boolean> {
    return this.confirm({
      title: 'Salvar Alterações',
      message: message || 'Deseja salvar as alterações realizadas?',
      confirmText: 'Salvar',
      cancelText: 'Cancelar',
      type: 'success',
      icon: 'save'
    });
  }

  /**
   * Quick confirmation for discard changes
   */
  confirmDiscard(): Observable<boolean> {
    return this.confirm({
      title: 'Descartar Alterações',
      message: 'Existem alterações não salvas. Deseja descartá-las?',
      details: 'Todas as alterações serão perdidas.',
      confirmText: 'Descartar',
      cancelText: 'Continuar Editando',
      type: 'warning',
      icon: 'warning'
    });
  }

  /**
   * Quick confirmation for logout
   */
  confirmLogout(): Observable<boolean> {
    return this.confirm({
      title: 'Sair da Aplicação',
      message: 'Deseja realmente sair da aplicação?',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
      type: 'info',
      icon: 'logout'
    });
  }

  /**
   * Quick confirmation for navigation with unsaved changes
   */
  confirmNavigation(): Observable<boolean> {
    return this.confirm({
      title: 'Sair da Página',
      message: 'Existem alterações não salvas. Deseja sair mesmo assim?',
      details: 'As alterações serão perdidas se você sair agora.',
      confirmText: 'Sair',
      cancelText: 'Ficar',
      type: 'warning',
      icon: 'exit_to_app'
    });
  }

  /**
   * Custom confirmation with predefined styling
   */
  confirmAction(
    title: string,
    message: string,
    confirmText: string = 'Confirmar',
    type: 'warning' | 'danger' | 'info' | 'success' = 'info'
  ): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmText,
      cancelText: 'Cancelar',
      type
    });
  }
}
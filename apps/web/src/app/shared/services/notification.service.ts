import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationComponent, NotificationData } from '../components/notification/notification.component';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Shows a notification
   * @param data Notification configuration
   * @returns MatSnackBarRef for further control
   */
  show(data: NotificationData): MatSnackBarRef<NotificationComponent> {
    const config = {
      duration: data.duration || this.getDefaultDuration(data.type),
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
      panelClass: [`notification-${data.type}`],
      data
    };

    return this.snackBar.openFromComponent(NotificationComponent, config);
  }

  /**
   * Shows a success notification
   */
  success(message: string, action?: string, duration?: number): MatSnackBarRef<NotificationComponent> {
    return this.show({
      message,
      type: 'success',
      action,
      duration
    });
  }

  /**
   * Shows an error notification
   */
  error(message: string, action?: string, duration?: number): MatSnackBarRef<NotificationComponent> {
    return this.show({
      message,
      type: 'error',
      action,
      duration: duration || 0 // Errors don't auto-dismiss by default
    });
  }

  /**
   * Shows a warning notification
   */
  warning(message: string, action?: string, duration?: number): MatSnackBarRef<NotificationComponent> {
    return this.show({
      message,
      type: 'warning',
      action,
      duration
    });
  }

  /**
   * Shows an info notification
   */
  info(message: string, action?: string, duration?: number): MatSnackBarRef<NotificationComponent> {
    return this.show({
      message,
      type: 'info',
      action,
      duration
    });
  }

  /**
   * Dismisses all notifications
   */
  dismissAll(): void {
    this.snackBar.dismiss();
  }

  /**
   * Quick success notifications for common actions
   */
  saveSuccess(itemName?: string): MatSnackBarRef<NotificationComponent> {
    const message = itemName ? `${itemName} salvo com sucesso!` : 'Salvo com sucesso!';
    return this.success(message);
  }

  deleteSuccess(itemName?: string): MatSnackBarRef<NotificationComponent> {
    const message = itemName ? `${itemName} excluído com sucesso!` : 'Excluído com sucesso!';
    return this.success(message);
  }

  updateSuccess(itemName?: string): MatSnackBarRef<NotificationComponent> {
    const message = itemName ? `${itemName} atualizado com sucesso!` : 'Atualizado com sucesso!';
    return this.success(message);
  }

  createSuccess(itemName?: string): MatSnackBarRef<NotificationComponent> {
    const message = itemName ? `${itemName} criado com sucesso!` : 'Criado com sucesso!';
    return this.success(message);
  }

  /**
   * Quick error notifications for common actions
   */
  saveError(details?: string): MatSnackBarRef<NotificationComponent> {
    const message = 'Erro ao salvar. Tente novamente.';
    return this.error(message, details ? 'Detalhes' : undefined);
  }

  deleteError(details?: string): MatSnackBarRef<NotificationComponent> {
    const message = 'Erro ao excluir. Tente novamente.';
    return this.error(message, details ? 'Detalhes' : undefined);
  }

  loadError(details?: string): MatSnackBarRef<NotificationComponent> {
    const message = 'Erro ao carregar dados. Tente novamente.';
    return this.error(message, 'Recarregar');
  }

  networkError(): MatSnackBarRef<NotificationComponent> {
    return this.error(
      'Erro de conexão. Verifique sua internet.',
      'Tentar Novamente'
    );
  }

  /**
   * Quick warning notifications
   */
  unsavedChanges(): MatSnackBarRef<NotificationComponent> {
    return this.warning(
      'Você tem alterações não salvas.',
      'Salvar',
      8000
    );
  }

  sessionExpiring(minutes: number): MatSnackBarRef<NotificationComponent> {
    return this.warning(
      `Sua sessão expira em ${minutes} minutos.`,
      'Renovar',
      0
    );
  }

  /**
   * Quick info notifications
   */
  dataRefreshed(): MatSnackBarRef<NotificationComponent> {
    return this.info('Dados atualizados.', undefined, 3000);
  }

  operationInProgress(operation: string): MatSnackBarRef<NotificationComponent> {
    return this.info(`${operation} em andamento...`, undefined, 0);
  }

  private getDefaultDuration(type: NotificationData['type']): number {
    switch (type) {
      case 'success':
        return 4000;
      case 'error':
        return 0; // Don't auto-dismiss errors
      case 'warning':
        return 6000;
      case 'info':
      default:
        return 4000;
    }
  }
}
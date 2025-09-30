import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface TranslationData {
  [key: string]: string | TranslationData;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLanguage = 'pt-BR';
  private translations: { [lang: string]: TranslationData } = {};
  private languageSubject = new BehaviorSubject<string>(this.currentLanguage);
  
  public language$ = this.languageSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredLanguage();
    this.loadTranslations(this.currentLanguage);
  }

  private loadStoredLanguage(): void {
    const stored = localStorage.getItem('ifrs15-language');
    if (stored) {
      this.currentLanguage = stored;
    }
  }

  loadTranslations(language: string): Observable<TranslationData> {
    if (this.translations[language]) {
      return new BehaviorSubject(this.translations[language]).asObservable();
    }

    return this.http.get<TranslationData>(`/assets/i18n/${language}.json`).pipe(
      map(translations => {
        this.translations[language] = translations;
        return translations;
      })
    );
  }

  setLanguage(language: string): void {
    if (language !== this.currentLanguage) {
      this.currentLanguage = language;
      localStorage.setItem('ifrs15-language', language);
      this.languageSubject.next(language);
      
      if (!this.translations[language]) {
        this.loadTranslations(language).subscribe();
      }
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  translate(key: string, params?: { [key: string]: any }): string {
    const translation = this.getTranslation(key);
    
    if (!params) {
      return translation;
    }

    // Replace parameters in translation
    return Object.keys(params).reduce((result, param) => {
      return result.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
    }, translation);
  }

  instant(key: string, params?: { [key: string]: any }): string {
    return this.translate(key, params);
  }

  private getTranslation(key: string): string {
    const translations = this.translations[this.currentLanguage];
    if (!translations) {
      return key;
    }

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  }

  // Helper methods for common translations
  getCommonTranslation(key: string): string {
    return this.translate(`common.${key}`);
  }

  getValidationMessage(key: string, params?: { [key: string]: any }): string {
    return this.translate(`validation.${key}`, params);
  }

  getIfrs15Translation(key: string): string {
    return this.translate(`ifrs15.${key}`);
  }

  getTooltip(key: string): string {
    return this.translate(`tooltips.${key}`);
  }

  getErrorMessage(key: string): string {
    return this.translate(`errors.${key}`);
  }

  // Format currency according to locale
  formatCurrency(value: number, currency: string = 'BRL'): string {
    const locale = this.getLocale();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(value);
  }

  // Format date according to locale
  formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const locale = this.getLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      medium: { day: '2-digit', month: 'short', year: 'numeric' },
      long: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
    }[format];

    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }

  // Format number according to locale
  formatNumber(value: number, decimals: number = 2): string {
    const locale = this.getLocale();
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  // Format percentage according to locale
  formatPercentage(value: number, decimals: number = 2): string {
    const locale = this.getLocale();
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  private getLocale(): string {
    const localeMap: { [key: string]: string } = {
      'pt-BR': 'pt-BR',
      'en-US': 'en-US',
      'es-ES': 'es-ES'
    };
    
    return localeMap[this.currentLanguage] || 'pt-BR';
  }

  // Get available languages
  getAvailableLanguages(): Array<{ code: string; name: string; flag: string }> {
    return [
      { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
      { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
      { code: 'es-ES', name: 'Español', flag: '🇪🇸' }
    ];
  }
}

// Translation pipe for templates
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(key: string, params?: { [key: string]: any }): string {
    return this.i18n.translate(key, params);
  }
}

// Directive for translating element content
import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appTranslate]'
})
export class TranslateDirective implements OnInit, OnDestroy {
  @Input('appTranslate') key: string = '';
  @Input() translateParams?: { [key: string]: any };

  private subscription?: Subscription;

  constructor(
    private element: ElementRef,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.updateTranslation();
    
    this.subscription = this.i18n.language$.subscribe(() => {
      this.updateTranslation();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private updateTranslation(): void {
    if (this.key) {
      const translation = this.i18n.translate(this.key, this.translateParams);
      this.element.nativeElement.textContent = translation;
    }
  }
}

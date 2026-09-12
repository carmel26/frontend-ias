import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  isSidebarOpen = false;
  isUserPopupOpen = false;

  constructor(
    public authService: AuthService,
    private eRef: ElementRef,
  ) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 1024) {
      this.isSidebarOpen = false;
    }
  }

  toggleUserPopup(event: MouseEvent) {
    event.stopPropagation();
    this.isUserPopupOpen = !this.isUserPopupOpen;
  }

  getUserInitials(user: User): string {
    const f = user.first_name ? user.first_name[0] : '';
    const s = user.surname ? user.surname[0] : '';
    return (f + s).toUpperCase() || 'U';
  }

  logout() {
    this.isUserPopupOpen = false;
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (
      this.isUserPopupOpen &&
      !this.eRef.nativeElement.contains(event.target)
    ) {
      this.isUserPopupOpen = false;
    }
  }
}

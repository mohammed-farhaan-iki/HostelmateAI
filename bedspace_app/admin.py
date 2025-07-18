# bedspace_app/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Property, Unit, Bed, Tenant, BookingAgreement, Payment, Expense,
    SubscriptionPlan, Subscription
)

# Custom User Admin
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_superuser', 'has_active_subscription', 'id')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    readonly_fields = ('last_login', 'date_joined')
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password', 'first_name', 'last_name'),
        }),
    )

admin.site.register(User, CustomUserAdmin)

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('property_name', 'owner', 'city', 'country', 'created_at')
    search_fields = ('property_name', 'address', 'city', 'country')
    list_filter = ('city', 'country')
    raw_id_fields = ('owner',)

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('unit_number', 'property', 'bedspace_type', 'rent_per_bed', 'owner')
    list_filter = ('bedspace_type',)
    search_fields = ('unit_number', 'property__property_name')
    raw_id_fields = ('property', 'owner')

@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ('bed_number', 'unit', 'location_in_unit', 'is_active', 'owner')
    list_filter = ('is_active',)
    search_fields = ('bed_number', 'unit__unit_number', 'unit__property__property_name')
    raw_id_fields = ('unit', 'owner')

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('tenant_name', 'email', 'contact_number', 'owner')
    search_fields = ('tenant_name', 'email', 'identification_number')
    raw_id_fields = ('owner',)

@admin.register(BookingAgreement)
class BookingAgreementAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'bed', 'check_in_date', 'check_out_date', 'booking_status', 'owner')
    list_filter = ('booking_status', 'check_in_date', 'check_out_date')
    search_fields = ('tenant__tenant_name', 'bed__bed_number', 'property__property_name')
    raw_id_fields = ('owner', 'tenant', 'bed', 'unit', 'property')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'amount_paid', 'payment_date', 'payment_method', 'owner')
    list_filter = ('payment_method', 'payment_date')
    search_fields = ('tenant__tenant_name', 'booking__booking_id')
    raw_id_fields = ('owner', 'tenant', 'booking')

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'expense_date', 'category', 'property', 'display_units', 'owner') # <--- CHANGED 'unit' to 'display_units'
    list_filter = ('category', 'expense_date', 'property', 'units') # <--- CHANGED 'unit' to 'units'
    search_fields = ('description', 'category', 'property__property_name', 'units__unit_number') # Updated search fields for ManyToMany
    raw_id_fields = ('owner', 'property') # 'units' is now ManyToMany, handled by filter_horizontal
    filter_horizontal = ('units',) # <--- ADDED THIS FOR MANYTOMANY FIELD

    # Method to display multiple units in the list_display
    def display_units(self, obj):
        return ", ".join([unit.unit_number for unit in obj.units.all()])
    display_units.short_description = "Units" # Column header in admin list


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('plan_name', 'price', 'duration_months', 'plan_id')
    search_fields = ('plan_name',)

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('owner', 'plan', 'start_date', 'end_date', 'is_active', 'subscription_id')
    list_filter = ('is_active', 'plan')
    search_fields = ('owner__username', 'plan__plan_name')
    raw_id_fields = ('owner', 'plan')
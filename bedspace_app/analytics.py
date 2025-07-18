# bedspace_app/analytics.py

import pandas as pd
import numpy as np
from django.db.models import Sum, Count, F, ExpressionWrapper, fields
from django.utils import timezone
from datetime import date, timedelta

# Import your models
from .models import Property, Unit, Bed, Tenant, BookingAgreement, Payment, Expense, Subscription


def get_base_querysets(user):
    """
    Returns querysets filtered by owner for regular users, or all data for superusers.
    """
    if user.is_superuser:
        return {
            'properties': Property.objects.all(),
            'units': Unit.objects.all(),
            'beds': Bed.objects.all(),
            'tenants': Tenant.objects.all(),
            'bookings': BookingAgreement.objects.all(),
            'payments': Payment.objects.all(),
            'expenses': Expense.objects.all(),
            'subscriptions': Subscription.objects.all(),
        }
    else:
        return {
            'properties': Property.objects.filter(owner=user),
            'units': Unit.objects.filter(owner=user),
            'beds': Bed.objects.filter(owner=user),
            'tenants': Tenant.objects.filter(owner=user),
            'bookings': BookingAgreement.objects.filter(owner=user),
            'payments': Payment.objects.filter(owner=user),
            'expenses': Expense.objects.filter(owner=user),
            'subscriptions': Subscription.objects.filter(owner=user),
        }


def get_kpis(user):
    """
    Calculates and returns basic Key Performance Indicators (KPIs).
    """
    querysets = get_base_querysets(user)

    total_properties = querysets['properties'].count()
    total_units = querysets['units'].count()
    total_beds = querysets['beds'].count()
    total_tenants = querysets['tenants'].count()
    total_bookings = querysets['bookings'].count()

    # Occupancy calculation (current active bookings vs total active beds)
    active_bookings_today = querysets['bookings'].filter(
        booking_status='Active',
        check_in_date__lte=date.today(),
        check_out_date__gte=date.today()
    )
    current_occupied_beds_count = active_bookings_today.values('bed').distinct().count()

    # Get all beds that are marked as active (available for booking)
    total_active_beds_available = querysets['beds'].filter(is_active=True).count()

    current_occupancy_rate = (current_occupied_beds_count / total_active_beds_available * 100) \
                             if total_active_beds_available > 0 else 0

    # Financials
    total_revenue = querysets['payments'].aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
    total_expenses = querysets['expenses'].aggregate(Sum('amount'))['amount__sum'] or 0
    net_profit = total_revenue - total_expenses

    kpis = {
        'total_properties': total_properties,
        'total_units': total_units,
        'total_beds': total_beds,
        'total_tenants': total_tenants,
        'total_bookings': total_bookings,
        'current_occupied_beds_count': current_occupied_beds_count,
        'total_active_beds_available': total_active_beds_available,
        'current_occupancy_rate': round(current_occupancy_rate, 2),
        'total_revenue': float(total_revenue),
        'total_expenses': float(total_expenses),
        'net_profit': float(net_profit),
    }
    return kpis


def get_financial_trends(user, months=12):
    """
    Calculates monthly revenue and expenses for the last 'months' period.
    """
    querysets = get_base_querysets(user)
    today = timezone.now().date()
    start_date = today - timedelta(days=30 * months) # Approx. for months

    # Fetch payments and expenses within the period
    payments_data = list(querysets['payments'].filter(
        payment_date__gte=start_date
    ).values('payment_date', 'amount_paid'))

    expenses_data = list(querysets['expenses'].filter(
        expense_date__gte=start_date
    ).values('expense_date', 'amount'))

    # Create DataFrames
    df_payments = pd.DataFrame(payments_data)
    df_expenses = pd.DataFrame(expenses_data)

    # Convert dates to datetime objects and set as index
    if not df_payments.empty:
        df_payments['payment_date'] = pd.to_datetime(df_payments['payment_date'])
        df_payments.set_index('payment_date', inplace=True)
        monthly_revenue = df_payments['amount_paid'].resample('M').sum().fillna(0)
    else:
        monthly_revenue = pd.Series(0, index=pd.date_range(start=start_date, end=today, freq='M'))

    if not df_expenses.empty:
        df_expenses['expense_date'] = pd.to_datetime(df_expenses['expense_date'])
        df_expenses.set_index('expense_date', inplace=True)
        monthly_expenses = df_expenses['amount'].resample('M').sum().fillna(0)
    else:
        monthly_expenses = pd.Series(0, index=pd.date_range(start=start_date, end=today, freq='M'))

    # Align indices and calculate net profit
    # Create a full date range to ensure all months are present, even if no data
    full_index = pd.date_range(start=start_date, end=today, freq='M')
    monthly_revenue = monthly_revenue.reindex(full_index, fill_value=0)
    monthly_expenses = monthly_expenses.reindex(full_index, fill_value=0)

    monthly_net_profit = monthly_revenue - monthly_expenses

    # Format for JSON response
    financial_trends = {
        'months': [m.strftime('%Y-%m') for m in monthly_revenue.index],
        'revenue': monthly_revenue.tolist(),
        'expenses': monthly_expenses.tolist(),
        'net_profit': monthly_net_profit.tolist(),
    }
    return financial_trends


def get_expense_categories_breakdown(user):
    """
    Calculates the breakdown of expenses by category.
    """
    querysets = get_base_querysets(user)
    expenses_data = list(querysets['expenses'].values('category', 'amount'))

    if not expenses_data:
        return {'categories': [], 'amounts': []}

    df_expenses = pd.DataFrame(expenses_data)
    category_sums = df_expenses.groupby('category')['amount'].sum()

    breakdown = {
        'categories': category_sums.index.tolist(),
        'amounts': category_sums.tolist(),
    }
    return breakdown

# Add more analytical functions here as we progress:
# - get_occupancy_trends_by_property(user, property_id)
# - get_tenant_demographics(user)
# - etc.
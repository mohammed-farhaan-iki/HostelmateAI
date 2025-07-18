# C:/Users/Mohammed Farhaan/Desktop/HostelmateAI/hostelmate_backend/dashboard/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q, DecimalField, Value, Case, When
from django.db.models.functions import Coalesce
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal # Import Decimal for precise calculations

# Import caching decorators
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

# Import your models from bedspace_app
from bedspace_app.models import Property, Unit, Bed, Tenant, BookingAgreement, Payment, Expense, User


# Define fixed and variable expense categories
FIXED_EXPENSE_CATEGORIES = ['Rent', 'Salaries']
# All other categories will be considered variable


@method_decorator(cache_page(300), name='dispatch') # Cache for 5 minutes
class DashboardKPIsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # --- Date and Filter Parameters ---
        today = date.today()
        # Default to last 12 months for historical data if no dates are provided
        default_start_date = today - relativedelta(months=11) # Start of month 11 months ago
        default_start_date = default_start_date.replace(day=1)
        default_end_date = today

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        property_id_filter = request.query_params.get('property_id')
        bedspace_type_filter = request.query_params.get('bedspace_type')
        nationality_filter = request.query_params.get('nationality')
        expense_category_filter = request.query_params.get('expense_category')

        # What-If Analysis Sliders (global percentages)
        expense_increase_percent = Decimal(request.query_params.get('expense_increase_percent', '0'))
        occupancy_impact_percent = Decimal(request.query_params.get('occupancy_impact_percent', '0'))
        price_change_percent = Decimal(request.query_params.get('price_change_percent', '0'))

        try:
            selected_start_date = date.fromisoformat(start_date_str) if start_date_str else default_start_date
            selected_end_date = date.fromisoformat(end_date_str) if end_date_str else default_end_date
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        # Ensure selected_start_date is always at the beginning of the month for monthly trends
        selected_start_date = selected_start_date.replace(day=1)

        # Filter initial querysets based on user ownership
        if user.is_superuser:
            properties_qs = Property.objects.all()
            units_qs = Unit.objects.all()
            beds_qs = Bed.objects.all()
            tenants_qs = Tenant.objects.all()
            bookings_qs = BookingAgreement.objects.all()
            payments_qs = Payment.objects.all()
            expenses_qs = Expense.objects.all()
        else:
            properties_qs = Property.objects.filter(owner=user)
            units_qs = Unit.objects.filter(owner=user)
            beds_qs = Bed.objects.filter(owner=user)
            tenants_qs = Tenant.objects.filter(owner=user)
            bookings_qs = BookingAgreement.objects.filter(owner=user)
            payments_qs = Payment.objects.filter(owner=user)
            expenses_qs = Expense.objects.filter(owner=user)

        # Apply dashboard-wide filters
        if property_id_filter:
            properties_qs = properties_qs.filter(property_id=property_id_filter)
            units_qs = units_qs.filter(property_id=property_id_filter)
            beds_qs = beds_qs.filter(unit__property_id=property_id_filter)
            tenants_qs = tenants_qs.filter(bookings__bed__unit__property_id=property_id_filter).distinct()
            bookings_qs = bookings_qs.filter(bed__unit__property_id=property_id_filter)
            payments_qs = payments_qs.filter(booking__bed__unit__property_id=property_id_filter)
            expenses_qs = expenses_qs.filter(property_id=property_id_filter)

        if bedspace_type_filter:
            # Use unit__bedspace_type as bedspace_type is on Unit model
            beds_qs = beds_qs.filter(unit__bedspace_type=bedspace_type_filter)
            bookings_qs = bookings_qs.filter(bed__unit__bedspace_type=bedspace_type_filter)
            tenants_qs = tenants_qs.filter(bookings__bed__unit__bedspace_type=bedspace_type_filter).distinct()
            payments_qs = payments_qs.filter(booking__bed__unit__bedspace_type=bedspace_type_filter)

        if nationality_filter:
            tenants_qs = tenants_qs.filter(nationality=nationality_filter)
            bookings_qs = bookings_qs.filter(tenant__nationality=nationality_filter)
            payments_qs = payments_qs.filter(booking__tenant__nationality=nationality_filter)

        if expense_category_filter:
            expenses_qs = expenses_qs.filter(category=expense_category_filter)


        # --- KPI Calculations (Current Snapshot - generally not time-filtered by slider) ---

        total_properties = properties_qs.count()
        total_units = units_qs.count()
        total_beds_in_system = beds_qs.count() # All beds in the filtered properties

        # Active Bookings (current snapshot)
        active_bookings_today_qs = bookings_qs.filter(
            booking_status='Active',
            check_in_date__lte=today,
            check_out_date__gte=today
        )
        current_occupied_beds_count = active_bookings_today_qs.values('bed').distinct().count()

        total_active_beds_available = beds_qs.filter(is_active=True).count()
        vacant_beds = total_active_beds_available - current_occupied_beds_count

        current_occupancy_rate = (Decimal(current_occupied_beds_count) / total_active_beds_available * 100) \
                                 if total_active_beds_available > 0 else Decimal('0.0')

        total_tenants = tenants_qs.count()

        # Pending Amounts (current snapshot for active bookings)
        # Sum of expected rent for active bookings minus amount paid
        pending_payments_qs = bookings_qs.filter( # Use bookings_qs directly
            booking_status='Active',
            check_in_date__lte=today, # Tenant is currently occupying or supposed to be
            check_out_date__gte=today # Booking is still active
        )
        # Apply filters to this specific queryset as well
        if property_id_filter:
            pending_payments_qs = pending_payments_qs.filter(bed__unit__property_id=property_id_filter)
        if bedspace_type_filter:
            pending_payments_qs = pending_payments_qs.filter(bed__unit__bedspace_type=bedspace_type_filter) # Corrected
        if nationality_filter:
            pending_payments_qs = pending_payments_qs.filter(tenant__nationality=nationality_filter)


        # Calculate total expected rent for active bookings
        total_expected_rent_active_bookings = pending_payments_qs.aggregate(
            total=Coalesce(Sum('rent_amount', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        )['total']

        # Calculate total amount paid for active bookings (payments linked to these specific bookings)
        total_paid_active_bookings = payments_qs.filter(
            booking__in=pending_payments_qs, # Filter payments related to the pending_payments_qs bookings
            payment_date__lte=today # Only count payments made up to today
        ).aggregate(
            total=Coalesce(Sum('amount_paid', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        )['total']

        pending_amount = total_expected_rent_active_bookings - total_paid_active_bookings

        # Number of people with pending rent (unique tenants)
        num_people_pending_rent = pending_payments_qs.annotate(
            # Use related_name 'payments' from BookingAgreement to Payment
            paid_sum=Coalesce(Sum('payments__amount_paid', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        ).filter(
            paid_sum__lt=F('rent_amount')
        ).values('tenant').distinct().count()

        # New Tenants This Month (based on check_in_date in the current month of today)
        new_tenants_this_month = tenants_qs.filter(
            bookings__check_in_date__year=today.year,
            bookings__check_in_date__month=today.month
        ).distinct().count()

        # Active Bookings (count of currently active bookings)
        active_bookings_count = active_bookings_today_qs.count()

        # Number of Fully Paid Bookings (bookings that are active and fully paid)
        num_fully_paid_bookings = pending_payments_qs.annotate(
            paid_sum=Coalesce(Sum('payments__amount_paid', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        ).filter(
            paid_sum__gte=F('rent_amount') # paid sum is greater than or equal to rent amount
        ).count()

        # Due Date Tracking
        # Calculate these relative to today's date
        # Assuming 'due soon', 'due', 'overdue' refer to check-out dates for active bookings

        num_people_due_soon = bookings_qs.filter(
            booking_status='Active',
            check_out_date__gt=today,
            check_out_date__lte=today + timedelta(days=5)
        ).count()

        num_people_due = bookings_qs.filter(
            booking_status='Active',
            check_out_date__gt=today,
            check_out_date__lte=today + timedelta(days=2)
        ).count()

        num_people_overdue = bookings_qs.filter(
            booking_status='Active', # Still considered active for billing purposes if overdue
            check_out_date__lt=today - timedelta(days=1) # Check-out date is more than 1 day in the past
        ).count()


        # --- Aggregated Financials & Averages (Time-filtered by slider) ---
        financial_payments_qs = payments_qs.filter(
            payment_date__gte=selected_start_date,
            payment_date__lte=selected_end_date
        )
        financial_expenses_qs = expenses_qs.filter(
            expense_date__gte=selected_start_date,
            expense_date__lte=selected_end_date
        )
        financial_bookings_qs = bookings_qs.filter(
            check_in_date__lte=selected_end_date, # Booking starts before end of period
            check_out_date__gte=selected_start_date # Booking ends after start of period
        )

        total_revenue_period = financial_payments_qs.aggregate(
            total=Coalesce(Sum('amount_paid', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        )['total']
        actual_revenue = total_revenue_period # As per clarification

        total_expenses_period = financial_expenses_qs.aggregate(
            total=Coalesce(Sum('amount', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        )['total']

        operating_profit = total_revenue_period - total_expenses_period

        # Profit Margin (for selected period)
        profit_margin = (operating_profit / total_revenue_period * 100) if total_revenue_period > 0 else Decimal('0.0')

        # Average Monthly Revenue Per Bed (over the selected period)
        # Calculate actual number of months in the period
        delta_months = (selected_end_date.year - selected_start_date.year) * 12 + (selected_end_date.month - selected_start_date.month) + 1
        num_months_in_period = Decimal(max(1, delta_months)) # Ensure at least 1 month

        total_occupied_beds_in_period = financial_bookings_qs.filter(
            booking_status='Active' # Consider only active bookings in the period
        ).values('bed').distinct().count()

        avg_monthly_revenue_per_bed = (total_revenue_period / num_months_in_period) / Decimal(total_occupied_beds_in_period) \
                                      if total_occupied_beds_in_period > 0 else Decimal('0.0')

        # Total Fixed/Variable Monthly Expenses (over selected period)
        total_fixed_expenses_period = financial_expenses_qs.filter(
            category__in=FIXED_EXPENSE_CATEGORIES
        ).aggregate(
            total=Coalesce(Sum('amount', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        )['total']

        total_variable_expenses_period = financial_expenses_qs.exclude(
            category__in=FIXED_EXPENSE_CATEGORIES
        ).aggregate(
            total=Coalesce(Sum('amount', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        )['total']

        # Average Variable Monthly Expense Per Bed
        avg_variable_monthly_expense_per_bed = (total_variable_expenses_period / num_months_in_period) / Decimal(total_occupied_beds_in_period) \
                                               if total_occupied_beds_in_period > 0 else Decimal('0.0')

        # Break-Even Occupancy (Number)
        # Formula: Total Fixed Expenses / (Average Monthly Revenue Per Bed - Average Variable Monthly Expense Per Bed)
        denominator = avg_monthly_revenue_per_bed - avg_variable_monthly_expense_per_bed
        break_even_occupancy = (total_fixed_expenses_period / denominator) \
                               if denominator > 0 else Decimal('0.0')
        break_even_occupancy = max(Decimal('0.0'), break_even_occupancy) # Ensure it's not negative

        # Avg. Price Per Bedspace (over selected period)
        avg_price_per_bedspace = (total_revenue_period / Decimal(total_occupied_beds_in_period)) \
                                 if total_occupied_beds_in_period > 0 else Decimal('0.0')

        # Projected Future Revenue (from confirmed/active bookings whose checkout date is in future)
        projected_future_revenue_qs = bookings_qs.filter(
            booking_status__in=['Confirmed', 'Active'], # Consider Confirmed and Active bookings
            check_out_date__gt=today # Checkout date is in the future
        )
        projected_future_revenue = projected_future_revenue_qs.aggregate(
            total=Coalesce(Sum('rent_amount', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        )['total']


        # Total Monthly Expected Revenue (for the current month of today)
        # This is revenue expected from bookings that are active/confirmed and span the current month
        total_monthly_expected_revenue_qs = bookings_qs.filter(
            booking_status__in=['Confirmed', 'Active'],
            check_in_date__lte=today.replace(day=today.day), # Booking starts by today
            check_out_date__gte=today.replace(day=1) # Booking ends after start of current month
        )
        total_monthly_expected_revenue = total_monthly_expected_revenue_qs.aggregate(
            total=Coalesce(Sum('rent_amount', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        )['total']

        # --- Chart Data (Monthly Trends, adapts to slider) ---
        monthly_trends = []
        current_iter_date = selected_start_date.replace(day=1) # Start from the first day of the start month

        while current_iter_date <= selected_end_date:
            month_start = current_iter_date
            month_end = (current_iter_date + relativedelta(months=1)) - timedelta(days=1)

            # Monthly Revenue
            monthly_revenue = payments_qs.filter(
                payment_date__gte=month_start,
                payment_date__lte=month_end
            ).aggregate(
                total=Coalesce(Sum('amount_paid', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
            )['total']

            # Monthly Expenses
            monthly_expenses = expenses_qs.filter(
                expense_date__gte=month_start,
                expense_date__lte=month_end
            ).aggregate(
                total=Coalesce(Sum('amount', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
            )['total']

            # Calculate Net Profit for the month
            monthly_net_profit = monthly_revenue - monthly_expenses # <--- ADDED THIS LINE

            # Monthly Occupancy Rate
            # Filter bookings for the specific month
            bookings_for_month = bookings_qs.filter(
                Q(check_in_date__lte=month_end, check_out_date__gte=month_start)
            )
            occupied_beds_for_month = bookings_for_month.values('bed').distinct().count()

            # Total beds active in the month
            total_beds_active_in_month = beds_qs.filter(is_active=True).count()

            monthly_occupancy_rate = (Decimal(occupied_beds_for_month) / total_beds_active_in_month * 100) \
                                     if total_beds_active_in_month > 0 else Decimal('0.0')

            monthly_trends.append({
                'month': month_start.strftime('%Y-%m'), # Format: YYYY-MM
                'revenue': float(monthly_revenue),
                'expenses': float(monthly_expenses),
                'profit': float(monthly_net_profit), # <--- ADDED THIS LINE
                'occupancy_rate': round(float(monthly_occupancy_rate), 2)
            })

            current_iter_date += relativedelta(months=1)
            # Monthly Revenue
            monthly_revenue = payments_qs.filter(
                payment_date__gte=month_start,
                payment_date__lte=month_end
            ).aggregate(
                total=Coalesce(Sum('amount_paid', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
            )['total']

            # Monthly Expenses
            monthly_expenses = expenses_qs.filter(
                expense_date__gte=month_start,
                expense_date__lte=month_end
            ).aggregate(
                total=Coalesce(Sum('amount', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
            )['total']

            # Monthly Occupancy Rate
            # Filter bookings for the specific month
            bookings_for_month = bookings_qs.filter(
                Q(check_in_date__lte=month_end, check_out_date__gte=month_start)
            )
            occupied_beds_for_month = bookings_for_month.values('bed').distinct().count()

            # Total beds active in the month
            total_beds_active_in_month = beds_qs.filter(is_active=True).count()

            monthly_occupancy_rate = (Decimal(occupied_beds_for_month) / total_beds_active_in_month * 100) \
                                     if total_beds_active_in_month > 0 else Decimal('0.0')

            monthly_trends.append({
                'month': month_start.strftime('%Y-%m'), # Format: YYYY-MM
                'revenue': float(monthly_revenue),
                'expenses': float(monthly_expenses),
                'occupancy_rate': round(float(monthly_occupancy_rate), 2)
            })

            current_iter_date += relativedelta(months=1)


        # --- Other Chart Data (e.g., for pie/bar charts) ---

        # Revenue by Property ID
        revenue_by_property = financial_payments_qs.values('booking__property__property_name').annotate(
            total_revenue=Coalesce(Sum('amount_paid', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        ).order_by('booking__property__property_name')

        revenue_by_property_data = [
            {'property_name': item['booking__property__property_name'] or 'N/A', 'revenue': float(item['total_revenue'])}
            for item in revenue_by_property
        ]

        # Expense Breakdown by Category
        expense_by_category = financial_expenses_qs.values('category').annotate(
            total_amount=Coalesce(Sum('amount', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
        ).order_by('category')

        expense_by_category_data = [
            {'category': item['category'] or 'N/A', 'amount': float(item['total_amount'])}
            for item in expense_by_category
        ]

        # Top 10 Nationalities (Tenant Demographics)
        top_nationalities = tenants_qs.values('nationality').annotate(
            count=Count('tenant_id') # Corrected
        ).order_by('-count')[:10]

        top_nationalities_data = [
            {'nationality': item['nationality'] or 'N/A', 'count': item['count']}
            for item in top_nationalities
        ]

        # Profit Margin by Sharing Type
        # This is complex. We need to link expenses to sharing type.
        # Assuming for now, we calculate revenue per sharing type and use overall expenses for simplicity
        # A more accurate calculation would require expenses to be directly linked to units/beds with sharing types.
        profit_margin_by_sharing_type = []
        bedspace_types = Unit.objects.values_list('bedspace_type', flat=True).distinct().exclude(bedspace_type__isnull=True).exclude(bedspace_type__exact='')

        for unit_bedspace_type in bedspace_types:
            # Revenue for this sharing type
            type_revenue = financial_payments_qs.filter(
                booking__bed__unit__bedspace_type=unit_bedspace_type # Corrected
            ).aggregate(
                total=Coalesce(Sum('amount_paid', output_field=DecimalField()), Value(Decimal('0.0'), output_field=DecimalField()))
            )['total']

            # For expenses, it's hard to directly link to sharing type without more model fields.
            # For now, we'll use a proportional share of total expenses.

            # Calculate occupied beds for this sharing type in the period
            occupied_beds_of_type_in_period = financial_bookings_qs.filter(
                booking_status='Active',
                bed__unit__bedspace_type=unit_bedspace_type # Corrected
            ).values('bed').distinct().count()

            if total_occupied_beds_in_period > 0:
                proportional_expenses = (Decimal(occupied_beds_of_type_in_period) / Decimal(total_occupied_beds_in_period)) * total_expenses_period
            else:
                proportional_expenses = Decimal('0.0')

            type_profit = type_revenue - proportional_expenses
            type_profit_margin = (type_profit / type_revenue * 100) if type_revenue > 0 else Decimal('0.0')

            profit_margin_by_sharing_type.append({
                'sharing_type': unit_bedspace_type, # Corrected
                'profit_margin': round(float(type_profit_margin), 2)
            })

        # Occupancy share by Property
        occupancy_by_property = []
        for prop in properties_qs:
            beds_in_property = beds_qs.filter(unit__property=prop, is_active=True).count()
            occupied_beds_in_property = active_bookings_today_qs.filter(
                bed__unit__property=prop
            ).values('bed').distinct().count()

            prop_occupancy_rate = (Decimal(occupied_beds_in_property) / beds_in_property * 100) \
                                 if beds_in_property > 0 else Decimal('0.0')
            occupancy_by_property.append({
                'property_name': prop.property_name,
                'occupancy_rate': round(float(prop_occupancy_rate), 2)
            })


        # Occupancy Rate by Bedspace Type
        occupancy_rate_by_bedspace_type = []
        for unit_bedspace_type in bedspace_types: # Re-using bedspace_types from above
            beds_of_type = beds_qs.filter(unit__bedspace_type=unit_bedspace_type, is_active=True).count() # Corrected
            occupied_beds_of_type = active_bookings_today_qs.filter(
                bed__unit__bedspace_type=unit_bedspace_type # Corrected
            ).values('bed').distinct().count()

            type_occupancy_rate = (Decimal(occupied_beds_of_type) / beds_of_type * 100) \
                                  if beds_of_type > 0 else Decimal('0.0')
            occupancy_rate_by_bedspace_type.append({
                'bedspace_type': unit_bedspace_type, # Corrected
                'occupancy_rate': round(float(type_occupancy_rate), 2)
            })


        # --- What-If Analysis Calculations ---
        # Base values for what-if (using current period's total revenue, expenses, and occupancy)
        base_total_revenue = total_revenue_period
        base_total_expenses = total_expenses_period
        base_occupancy_rate = current_occupancy_rate / 100 # Convert to decimal for calculation

        # Projected Revenue with Price Change
        # Assuming price change applies to base_total_revenue
        projected_revenue_with_price_change = base_total_revenue * (Decimal('1') + price_change_percent / 100)

        # Occupancy Rate with Impact
        # Assuming impact applies to current_occupancy_rate
        occupancy_rate_with_impact = base_occupancy_rate * (Decimal('1') + occupancy_impact_percent / 100)
        occupancy_rate_with_impact = min(Decimal('1.0'), max(Decimal('0.0'), occupancy_rate_with_impact)) # Cap between 0 and 1

        # Profit Margin with Expense Impact
        # Recalculate profit based on increased expenses
        impacted_total_expenses = base_total_expenses * (Decimal('1') + expense_increase_percent / 100)
        impacted_operating_profit = base_total_revenue - impacted_total_expenses
        profit_margin_with_expense_impact = (impacted_operating_profit / base_total_revenue * 100) \
                                             if base_total_revenue > 0 else Decimal('0.0')


        # --- Final Data Response ---
        data = {
            "kpis": {
                "total_properties": total_properties,
                "total_units": total_units,
                "total_beds_in_system": total_beds_in_system,
                "current_occupied_beds_count": current_occupied_beds_count,
                "vacant_beds": vacant_beds,
                "current_occupancy_rate": round(float(current_occupancy_rate), 2),
                "total_tenants": total_tenants,
                "pending_amount": round(float(pending_amount), 2),
                "num_people_pending_rent": num_people_pending_rent,
                "new_tenants_this_month": new_tenants_this_month,
                "active_bookings_count": active_bookings_count,
                "actual_revenue": round(float(actual_revenue), 2),
                "avg_monthly_revenue_per_bed": round(float(avg_monthly_revenue_per_bed), 2),
                "break_even_occupancy": round(float(break_even_occupancy), 2),
                "avg_price_per_bedspace": round(float(avg_price_per_bedspace), 2),
                "profit_margin": round(float(profit_margin), 2),
                "projected_future_revenue": round(float(projected_future_revenue), 2),
                "total_monthly_expected_revenue": round(float(total_monthly_expected_revenue), 2),
                "total_fixed_monthly_expenses": round(float(total_fixed_expenses_period), 2),
                "total_variable_monthly_expenses": round(float(total_variable_expenses_period), 2),
                "total_payments_collected": round(float(total_revenue_period), 2),
                "num_fully_paid_bookings": num_fully_paid_bookings,
                "num_people_due_soon": num_people_due_soon,
                "num_people_due": num_people_due,
                "num_people_overdue": num_people_overdue,
            },
            "charts_data": {
                "monthly_trends": monthly_trends,
                "revenue_by_property": revenue_by_property_data,
                "expense_by_category": expense_by_category_data,
                "top_nationalities": top_nationalities_data,
                "profit_margin_by_sharing_type": profit_margin_by_sharing_type,
                "occupancy_by_property": occupancy_by_property,
                "occupancy_rate_by_bedspace_type": occupancy_rate_by_bedspace_type,
                "future_revenue_projection_chart": [],
            },
            "what_if_analysis": {
                "projected_revenue_with_price_change": round(float(projected_revenue_with_price_change), 2),
                "occupancy_rate_with_impact": round(float(occupancy_rate_with_impact * 100), 2),
                "profit_margin_with_expense_impact": round(float(profit_margin_with_expense_impact), 2),
            }
        }

        return Response(data)
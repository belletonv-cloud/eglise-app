<template>
  <div class="bg-white min-h-[calc(100vh-64px)] pb-20 md:pb-0">
    <!-- Top banner (desktop) -->
    <div class="hidden md:block bg-[#2ECC71]">
      <div class="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div class="text-center lg:text-left">
          <div class="text-4xl font-extrabold text-white tracking-tight">Serving Schedule</div>
          <div class="mt-2 text-white/90 text-lg">
            Accept or Decline scheduling requests for your entire family
          </div>
        </div>

        <div class="flex justify-center lg:justify-end">
          <div class="w-[340px] rounded-[2.25rem] bg-black p-3 shadow-2xl">
            <div class="rounded-[1.9rem] bg-white overflow-hidden">
              <ServingSchedulePhone />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Phone-only layout (mobile) -->
    <div class="md:hidden max-w-md mx-auto">
      <ServingSchedulePhone />
    </div>

    <PlanningCenterMobileNav active="schedule" />
  </div>
</template>

<script setup lang="ts">
import PlanningCenterMobileNav from '../components/PlanningCenterMobileNav.vue'
import ServingSchedulePhone from '../components/ServingSchedulePhone.vue'
</script>

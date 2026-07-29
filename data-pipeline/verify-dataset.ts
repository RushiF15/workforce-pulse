import { readFileSync } from 'node:fs';
import { buildWorkforceDataset } from './pipeline';
import type { DataIssue } from './types/common';

const ds = buildWorkforceDataset(
  readFileSync('data/employees.json', 'utf-8'),
  readFileSync('data/activity_logs.csv', 'utf-8'),
);
const d = ds.diagnostics;
console.log('employees read/after merge:', d.employeeRecordsRead, '->', d.employeesAfterMerge, '| merged dupes:', d.duplicateEmployeeRecordsMerged);
console.log('synthetic employees:', d.syntheticEmployeesCreated, '| no activity:', d.employeesWithoutActivity);
console.log('activity read/kept:', d.activityRowsRead, '->', d.activityRowsKept, '| dup dropped:', d.duplicateActivityRowsDropped, '| orphans:', d.orphanActivityRows, '| bad ts:', d.unparseableTimestampRows);
console.log('unmapped apps:', d.unmappedApps, '| unmapped cats:', d.unmappedTaskCategories);
console.log('date range:', ds.dateRange);
console.log('issues by code:', d.issueCountsByCode);
console.log('\nsample employee E007 (merged):', JSON.stringify(ds.byEmployee['E007'].employee, null, 1));
console.log('\nsample activity:', JSON.stringify(ds.activities[0], null, 1));
console.log('\nE099 summary:', JSON.stringify(ds.byEmployee['E099'].summary));
console.log('E013 synthetic:', ds.byEmployee['E013'].employee.isSynthetic, ds.byEmployee['E013'].summary.activityCount);
console.log('\nconflict + post-term issues:');
d.issues.filter((i: DataIssue)=>['CONFLICTING_EMPLOYEE_FIELD','POST_TERMINATION_ACTIVITY','INVALID_DURATION','IMPLAUSIBLE_DURATION'].includes(i.code)).forEach((i: DataIssue)=>console.log(' -',i.code, i.entityId, i.message));

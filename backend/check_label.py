from datasets import load_dataset
from collections import Counter

ds = load_dataset('cnamuangtoun/resume-job-description-fit')

train_labels = ds['train']['label']
test_labels  = ds['test']['label']

print('=== TRAIN ===')
for label, count in Counter(train_labels).items():
    pct = count/len(train_labels)*100
    print(f'  {label:<15}: {count:>4} ({pct:.1f}%)')

print()
print('=== TEST ===')
for label, count in Counter(test_labels).items():
    pct = count/len(test_labels)*100
    print(f'  {label:<15}: {count:>4} ({pct:.1f}%)')

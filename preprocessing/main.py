import pandas as pd

def get_year(raw_date):
    two_digit_year = raw_date[-2::]
    if int(two_digit_year) > 24:
        return '19' + two_digit_year
    else:
        return '20' + two_digit_year

df = pd.read_csv('original_data.csv')

target_columns = ['Juvenile', 'State', 'Race', 'Execution Date', 'Sex', 'Number of White Male Victims', 'Number of Black Male Victims', 'Number of Latino Male Victims', 'Number of Asian Male Victims', 'Number of Native American Male Victims', 'Number of Other Race Male Victims',  'Number of White Female Victims', 'Number of Black Female Victims', 'Number of Latino Female Victims', 'Number of Asian Female Victims', 'Number of American Indian or Alaska Native Female Victims', 'Number of Other Race Female Victims']

df = df[target_columns]

print("Number of columns:")
print(len(df.columns), '\n')

print("All the column are:")
print(df.columns, '\n')

print("Unique states count:")
print(len(sorted(df['State'].unique())), '\n')

print("Unique states:")
print(sorted(df['State'].unique()), '\n')

print("Unique sex count:")
print(len(sorted(df['Sex'].unique())), '\n')

print("Unique sex:")
print(sorted(df['Sex'].unique()), '\n')

print("Unique race count:")
print(len(sorted(df['Race'].unique())), '\n')

print("Unique race:")
print(sorted(df['Race'].unique()), '\n')

print("Date ranges:")
print(df['Execution Date'].min())
print(df['Execution Date'].max(), '\n')

print("-----------------------------------------------------", '\n')

df['State'].replace(['Oklahoma '], 'Oklahoma', inplace=True)

df['Sex'].replace([' Male'], 'Male', inplace=True)

df['Race'].replace(['White '], 'White', inplace=True)

df['Execution Date'] = list(map(get_year, df['Execution Date']))

print("Unique states count:")
print(len(sorted(df['State'].unique())), '\n')

print("Unique states:")
print(sorted(df['State'].unique()), '\n')

print("Unique sex count:")
print(len(sorted(df['Sex'].unique())), '\n')

print("Unique sex:")
print(sorted(df['Sex'].unique()), '\n')

print("Unique race count:")
print(len(sorted(df['Race'].unique())), '\n')

print("Unique race:")
print(sorted(df['Race'].unique()), '\n')

print("Years:")
print(df['Execution Date'].unique(), '\n')

for column in target_columns:
    print(sorted(df[column].unique()), '\n')

df.to_csv('preprocessed_data.csv')